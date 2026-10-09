import os

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from auth_guard import get_current_user
from database import Base, engine, get_db
from models import Servicio
from schemas import ServicioCreate


app = FastAPI(
    title="Warlus CRM - Catalogo Service",
    description="Microservicio de catalogo de Warlus CRM",
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
                "ALTER TABLE servicios "
                "ADD COLUMN IF NOT EXISTS usuario_id INTEGER NULL"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_servicios_usuario_id "
                "ON servicios(usuario_id)"
            )
        )


@app.on_event("startup")
def on_startup():
    if os.getenv("SKIP_DB_STARTUP", "false").lower() != "true":
        ensure_schema()


def _serializar(servicio: Servicio, user_id: int) -> dict:
    return {
        "id": servicio.id,
        "nombre": servicio.nombre,
        "descripcion": servicio.descripcion,
        "precio": str(servicio.precio),
        "activo": servicio.activo,
        "created_at": servicio.created_at.isoformat() if servicio.created_at else None,
        "editable": servicio.usuario_id == user_id,
        "tipo": "propio" if servicio.usuario_id == user_id else "global",
    }


def _obtener_propio_o_404(
    servicio_id: int,
    user_id: int,
    db: Session,
) -> Servicio:
    servicio = (
        db.query(Servicio)
        .filter(
            Servicio.id == servicio_id,
            Servicio.usuario_id == user_id,
        )
        .first()
    )

    if servicio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado",
        )

    return servicio


@app.get("/")
def root():
    return {"message": "Microservicio de catalogo Warlus CRM"}


@app.get("/health")
def health():
    return {"service": "catalogo", "status": "OK"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"service": "catalogo", "database": "OK"}


@app.get("/servicios")
def list_servicios(
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    servicios = (
        db.query(Servicio)
        .filter(
            or_(
                Servicio.usuario_id.is_(None),
                Servicio.usuario_id == current["id"],
            )
        )
        .order_by(Servicio.nombre.asc())
        .all()
    )

    return [
        _serializar(servicio, current["id"])
        for servicio in servicios
    ]


@app.post("/servicios", status_code=status.HTTP_201_CREATED)
def create_servicio(
    data: ServicioCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    servicio = Servicio(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        precio=data.precio,
        activo=data.activo,
        usuario_id=current["id"],
    )

    db.add(servicio)
    db.commit()
    db.refresh(servicio)

    return _serializar(servicio, current["id"])


@app.put("/servicios/{servicio_id}")
def update_servicio(
    servicio_id: int,
    data: ServicioCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    servicio = _obtener_propio_o_404(
        servicio_id,
        current["id"],
        db,
    )

    servicio.nombre = data.nombre.strip()
    servicio.descripcion = data.descripcion.strip() if data.descripcion else None
    servicio.precio = data.precio
    servicio.activo = data.activo

    db.commit()
    db.refresh(servicio)

    return _serializar(servicio, current["id"])


@app.delete("/servicios/{servicio_id}")
def delete_servicio(
    servicio_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    servicio = _obtener_propio_o_404(
        servicio_id,
        current["id"],
        db,
    )

    usado = db.execute(
        text(
            "SELECT 1 FROM pedidos "
            "WHERE servicio_id = :sid "
            "LIMIT 1"
        ),
        {"sid": servicio_id},
    ).first()

    if usado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar un servicio que ya tiene pedidos",
        )

    db.delete(servicio)
    db.commit()

    return {"message": "Servicio eliminado"}