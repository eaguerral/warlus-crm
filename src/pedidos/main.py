from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Pedido
from schemas import PedidoCreate

app = FastAPI(
    title="Warlus CRM - Pedidos Service",
    description="Microservicio de gestion de pedidos de Warlus CRM",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


def _serializar(pedido: Pedido) -> dict:
    return {
        "id": pedido.id,
        "cliente": pedido.cliente,
        "servicio_id": pedido.servicio_id,
        "estado": pedido.estado,
    }


def _obtener_o_404(pedido_id: int, db: Session) -> Pedido:
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if pedido is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    return pedido


@app.get("/")
def root():
    return {
        "message": "Microservicio de pedidos Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "pedidos",
        "status": "OK"
    }


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "service": "pedidos",
        "database": "OK"
    }


@app.get("/pedidos")
def list_pedidos(db: Session = Depends(get_db)):
    pedidos = db.query(Pedido).all()
    return [_serializar(pedido) for pedido in pedidos]


@app.post("/pedidos")
def create_pedido(data: PedidoCreate, db: Session = Depends(get_db)):
    pedido = Pedido(
        cliente=data.cliente,
        servicio_id=data.servicio_id,
        estado=data.estado,
    )
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return _serializar(pedido)


@app.put("/pedidos/{pedido_id}")
def update_pedido(pedido_id: int, data: PedidoCreate, db: Session = Depends(get_db)):
    pedido = _obtener_o_404(pedido_id, db)
    pedido.cliente = data.cliente
    pedido.servicio_id = data.servicio_id
    pedido.estado = data.estado
    db.commit()
    db.refresh(pedido)
    return _serializar(pedido)


@app.delete("/pedidos/{pedido_id}")
def delete_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = _obtener_o_404(pedido_id, db)
    db.delete(pedido)
    db.commit()
    return {"message": "Pedido eliminado"}
