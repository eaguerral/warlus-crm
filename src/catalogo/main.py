from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Servicio
from schemas import ServicioCreate

app = FastAPI(
    title="Warlus CRM - Catalogo Service",
    description="Microservicio de catalogo de Warlus CRM",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


def _serializar(servicio: Servicio) -> dict:
    return {
        "id": servicio.id,
        "nombre": servicio.nombre,
        "descripcion": servicio.descripcion,
        "precio": str(servicio.precio),
        "activo": servicio.activo,
    }


def _obtener_o_404(servicio_id: int, db: Session) -> Servicio:
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if servicio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Servicio no encontrado")
    return servicio


@app.get("/")
def root():
    return {
        "message": "Microservicio de catalogo Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "catalogo",
        "status": "OK"
    }


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "service": "catalogo",
        "database": "OK"
    }


@app.get("/servicios")
def list_servicios(db: Session = Depends(get_db)):
    servicios = db.query(Servicio).all()
    return [_serializar(servicio) for servicio in servicios]


@app.post("/servicios")
def create_servicio(data: ServicioCreate, db: Session = Depends(get_db)):
    servicio = Servicio(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio=data.precio,
        activo=data.activo,
    )
    db.add(servicio)
    db.commit()
    db.refresh(servicio)
    return _serializar(servicio)


@app.put("/servicios/{servicio_id}")
def update_servicio(servicio_id: int, data: ServicioCreate, db: Session = Depends(get_db)):
    servicio = _obtener_o_404(servicio_id, db)
    servicio.nombre = data.nombre
    servicio.descripcion = data.descripcion
    servicio.precio = data.precio
    servicio.activo = data.activo
    db.commit()
    db.refresh(servicio)
    return _serializar(servicio)


@app.delete("/servicios/{servicio_id}")
def delete_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = _obtener_o_404(servicio_id, db)
    db.delete(servicio)
    db.commit()
    return {"message": "Servicio eliminado"}
