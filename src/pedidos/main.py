import os
import re
from collections import defaultdict

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import extract, func, text
from sqlalchemy.orm import Session

from auth_guard import get_current_user
from database import Base, engine, get_db
from models import Pedido
from schemas import PedidoCreate


ALLOWED_STATES = {
    "pendiente",
    "en proceso",
    "completado",
    "cancelado",
    "cerrado",
}


app = FastAPI(
    title="Warlus CRM - Pedidos Service",
    description="Microservicio de gestion de pedidos de Warlus CRM",
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
                "ALTER TABLE pedidos "
                "ADD COLUMN IF NOT EXISTS usuario_id INTEGER NULL"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id "
                "ON pedidos(usuario_id)"
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
            detail="Estado de pedido no permitido",
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


def _serializar(pedido: Pedido) -> dict:
    return {
        "id": pedido.id,
        "cliente": pedido.cliente,
        "servicio_id": pedido.servicio_id,
        "estado": pedido.estado,
        "created_at": pedido.created_at.isoformat() if pedido.created_at else None,
    }


def _own_or_404(pedido_id: int, user_id: int, db: Session) -> Pedido:
    pedido = (
        db.query(Pedido)
        .filter(
            Pedido.id == pedido_id,
            Pedido.usuario_id == user_id,
        )
        .first()
    )

    if pedido is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )

    return pedido


def _validate_service_visible(servicio_id: int, user_id: int, db: Session):
    row = db.execute(
        text(
            """
            SELECT id
            FROM servicios
            WHERE id = :sid
              AND activo = TRUE
              AND (usuario_id IS NULL OR usuario_id = :uid)
            LIMIT 1
            """
        ),
        {
            "sid": servicio_id,
            "uid": user_id,
        },
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no disponible",
        )


def _service_label(servicio_id: int, current_user_id: int, db: Session):
    row = db.execute(
        text(
            """
            SELECT nombre, usuario_id
            FROM servicios
            WHERE id = :sid
            """
        ),
        {"sid": servicio_id},
    ).mappings().first()

    if row is None:
        return "Servicio no disponible", None

    owner = row["usuario_id"]

    if owner is None or owner == current_user_id:
        return row["nombre"], servicio_id

    return "Otros servicios", None


@app.get("/")
def root():
    return {"message": "Microservicio de pedidos Warlus CRM"}


@app.get("/health")
def health():
    return {"service": "pedidos", "status": "OK"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"service": "pedidos", "database": "OK"}


# PRIVADO: solo pedidos del usuario autenticado.
@app.get("/pedidos")
def list_pedidos(
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current["id"])
        .order_by(Pedido.created_at.desc(), Pedido.id.desc())
        .all()
    )

    return [_serializar(pedido) for pedido in pedidos]


# GLOBAL AGREGADO: incluye TODOS los pedidos de TODO el CRM.
# No devuelve cliente, email, usuario_id ni detalle de otro usuario.
@app.get("/pedidos/resumen/global")
def resumen_global(
    mes: str | None = Query(default=None),
    servicio_id: int | None = Query(default=None, gt=0),
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month = parse_month(mes)

    query = db.query(Pedido)

    if month:
        year, month_number = month
        query = query.filter(
            extract("year", Pedido.created_at) == year,
            extract("month", Pedido.created_at) == month_number,
        )

    if servicio_id:
        query = query.filter(Pedido.servicio_id == servicio_id)

    total = query.count()

    estados_rows = (
        query.with_entities(
            Pedido.estado,
            func.count(Pedido.id),
        )
        .group_by(Pedido.estado)
        .all()
    )

    estados = {
        str(estado): int(cantidad)
        for estado, cantidad in estados_rows
    }

    completados = sum(
        estados.get(key, 0)
        for key in ("completado", "cerrado")
    )

    pendientes = sum(
        estados.get(key, 0)
        for key in ("pendiente", "en proceso")
    )

    otros = max(0, total - completados - pendientes)

    service_rows = (
        query.with_entities(
            Pedido.servicio_id,
            func.count(Pedido.id),
        )
        .group_by(Pedido.servicio_id)
        .all()
    )

    service_acc = defaultdict(int)
    service_ids = {}

    for sid, cantidad in service_rows:
        label, visible_id = _service_label(
            int(sid),
            current["id"],
            db,
        )

        service_acc[label] += int(cantidad)
        service_ids[label] = visible_id

    por_servicio = [
        {
            "servicio_id": service_ids[label],
            "servicio": label,
            "cantidad": cantidad,
        }
        for label, cantidad in sorted(
            service_acc.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    month_rows = (
        db.query(
            extract("year", Pedido.created_at).label("year"),
            extract("month", Pedido.created_at).label("month"),
            func.count(Pedido.id),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    meses_disponibles = [
        f"{int(year):04d}-{int(month_number):02d}"
        for year, month_number, _ in month_rows
        if year is not None and month_number is not None
    ]

    return {
        "total": total,
        "completados": completados,
        "pendientes": pendientes,
        "otros": otros,
        "estados": estados,
        "por_servicio": por_servicio,
        "meses_disponibles": meses_disponibles,
    }


@app.post("/pedidos", status_code=status.HTTP_201_CREATED)
def create_pedido(
    data: PedidoCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_service_visible(
        data.servicio_id,
        current["id"],
        db,
    )

    pedido = Pedido(
        cliente=data.cliente.strip(),
        servicio_id=data.servicio_id,
        estado=normalize_state(data.estado),
        usuario_id=current["id"],
    )

    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    return _serializar(pedido)


@app.put("/pedidos/{pedido_id}")
def update_pedido(
    pedido_id: int,
    data: PedidoCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pedido = _own_or_404(
        pedido_id,
        current["id"],
        db,
    )

    _validate_service_visible(
        data.servicio_id,
        current["id"],
        db,
    )

    pedido.cliente = data.cliente.strip()
    pedido.servicio_id = data.servicio_id
    pedido.estado = normalize_state(data.estado)

    db.commit()
    db.refresh(pedido)

    return _serializar(pedido)


@app.delete("/pedidos/{pedido_id}")
def delete_pedido(
    pedido_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pedido = _own_or_404(
        pedido_id,
        current["id"],
        db,
    )

    pago = db.execute(
        text(
            "SELECT 1 FROM pagos "
            "WHERE pedido_id = :pid "
            "LIMIT 1"
        ),
        {"pid": pedido_id},
    ).first()

    if pago:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El pedido tiene pagos asociados",
        )

    db.delete(pedido)
    db.commit()

    return {"message": "Pedido eliminado"}