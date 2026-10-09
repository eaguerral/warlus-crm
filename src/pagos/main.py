import os
import re
from collections import defaultdict
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth_guard import get_current_user
from database import Base, engine, get_db
from models import Pago
from schemas import PagoCreate


ALLOWED_STATES = {
    "pendiente",
    "completado",
    "pagado",
    "aprobado",
    "rechazado",
}


app = FastAPI(
    title="Warlus CRM - Pagos Service",
    description="Microservicio de gestion de pagos de Warlus CRM",
    version="2.0.0",
)

cors_origins = [
    item.strip()
    for item in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:4173",
    ).split(",")
    if item.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def secure_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


def ensure_schema():
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE pagos "
                "ADD COLUMN IF NOT EXISTS usuario_id INTEGER NULL"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id "
                "ON pagos(usuario_id)"
            )
        )


@app.on_event("startup")
def on_startup():
    if os.getenv("SKIP_DB_STARTUP", "false").lower() != "true":
        ensure_schema()


def normalize_state(value: str) -> str:
    state = value.strip().lower()

    if state not in ALLOWED_STATES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Estado de pago no permitido",
        )

    return state


def parse_month(value: str | None):
    if not value or value == "todos":
        return None

    if not re.fullmatch(r"\d{4}-\d{2}", value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mes invalido. Use YYYY-MM",
        )

    year, month = map(int, value.split("-"))

    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mes invalido",
        )

    return year, month


def _serializar(pago: Pago) -> dict:
    return {
        "id": pago.id,
        "pedido_id": pago.pedido_id,
        "monto": str(pago.monto),
        "metodo": pago.metodo,
        "estado": pago.estado,
        "created_at": pago.created_at.isoformat() if pago.created_at else None,
    }


def _own_or_404(pago_id: int, user_id: int, db: Session) -> Pago:
    pago = (
        db.query(Pago)
        .filter(
            Pago.id == pago_id,
            Pago.usuario_id == user_id,
        )
        .first()
    )

    if pago is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado",
        )

    return pago


def _validate_order_owner(pedido_id: int, user_id: int, db: Session):
    row = db.execute(
        text(
            """
            SELECT id
            FROM pedidos
            WHERE id = :pid
              AND usuario_id = :uid
            LIMIT 1
            """
        ),
        {
            "pid": pedido_id,
            "uid": user_id,
        },
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )


@app.get("/")
def root():
    return {"message": "Microservicio de pagos Warlus CRM"}


@app.get("/health")
def health():
    return {"service": "pagos", "status": "OK"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"service": "pagos", "database": "OK"}


# PRIVADO: solo pagos del usuario autenticado.
@app.get("/pagos")
def list_pagos(
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pagos = (
        db.query(Pago)
        .filter(Pago.usuario_id == current["id"])
        .order_by(Pago.created_at.desc(), Pago.id.desc())
        .all()
    )

    return [_serializar(pago) for pago in pagos]


# GLOBAL AGREGADO: incluye TODOS los pagos de TODO el CRM.
# Solo devuelve cantidades y montos agregados.
@app.get("/pagos/resumen/global")
def resumen_global(
    mes: str | None = Query(default=None),
    servicio_id: int | None = Query(default=None, gt=0),
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month = parse_month(mes)

    conditions = ["1=1"]
    params = {}

    if month:
        year, month_number = month
        conditions.append("EXTRACT(YEAR FROM p.created_at) = :year")
        conditions.append("EXTRACT(MONTH FROM p.created_at) = :month")
        params["year"] = year
        params["month"] = month_number

    if servicio_id:
        conditions.append("pe.servicio_id = :servicio_id")
        params["servicio_id"] = servicio_id

    where_sql = " AND ".join(conditions)

    totals = db.execute(
        text(
            f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (
                    WHERE LOWER(p.estado) IN ('completado','pagado','aprobado')
                ) AS completados,
                COUNT(*) FILTER (
                    WHERE LOWER(p.estado) = 'pendiente'
                ) AS pendientes,
                COALESCE(
                    SUM(p.monto) FILTER (
                        WHERE LOWER(p.estado) IN ('completado','pagado','aprobado')
                    ),
                    0
                ) AS monto_completado
            FROM pagos p
            JOIN pedidos pe ON pe.id = p.pedido_id
            WHERE {where_sql}
            """
        ),
        params,
    ).mappings().one()

    service_rows = db.execute(
        text(
            f"""
            SELECT
                pe.servicio_id,
                s.nombre,
                s.usuario_id AS servicio_usuario_id,
                COALESCE(SUM(p.monto), 0) AS monto
            FROM pagos p
            JOIN pedidos pe ON pe.id = p.pedido_id
            LEFT JOIN servicios s ON s.id = pe.servicio_id
            WHERE {where_sql}
              AND LOWER(p.estado) IN ('completado','pagado','aprobado')
            GROUP BY pe.servicio_id, s.nombre, s.usuario_id
            """
        ),
        params,
    ).mappings().all()

    acc = defaultdict(lambda: Decimal("0"))
    ids = {}

    for row in service_rows:
        owner = row["servicio_usuario_id"]

        if owner is None or owner == current["id"]:
            label = row["nombre"] or f"Servicio #{row['servicio_id']}"
            visible_id = row["servicio_id"]
        else:
            label = "Otros servicios"
            visible_id = None

        acc[label] += Decimal(row["monto"])
        ids[label] = visible_id

    por_servicio = [
        {
            "servicio_id": ids[label],
            "servicio": label,
            "monto": str(monto),
        }
        for label, monto in sorted(
            acc.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    return {
        "total": int(totals["total"]),
        "completados": int(totals["completados"]),
        "pendientes": int(totals["pendientes"]),
        "monto_completado": str(totals["monto_completado"]),
        "por_servicio": por_servicio,
    }


@app.post("/pagos", status_code=status.HTTP_201_CREATED)
def create_pago(
    data: PagoCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_order_owner(
        data.pedido_id,
        current["id"],
        db,
    )

    pago = Pago(
        pedido_id=data.pedido_id,
        monto=data.monto,
        metodo=data.metodo.strip(),
        estado=normalize_state(data.estado),
        usuario_id=current["id"],
    )

    db.add(pago)
    db.commit()
    db.refresh(pago)

    return _serializar(pago)


@app.put("/pagos/{pago_id}")
def update_pago(
    pago_id: int,
    data: PagoCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pago = _own_or_404(
        pago_id,
        current["id"],
        db,
    )

    _validate_order_owner(
        data.pedido_id,
        current["id"],
        db,
    )

    pago.pedido_id = data.pedido_id
    pago.monto = data.monto
    pago.metodo = data.metodo.strip()
    pago.estado = normalize_state(data.estado)

    db.commit()
    db.refresh(pago)

    return _serializar(pago)


@app.delete("/pagos/{pago_id}")
def delete_pago(
    pago_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pago = _own_or_404(
        pago_id,
        current["id"],
        db,
    )

    db.delete(pago)
    db.commit()

    return {"message": "Pago eliminado"}