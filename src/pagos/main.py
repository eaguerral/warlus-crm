from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Pago
from schemas import PagoCreate


app = FastAPI(
    title="Warlus CRM - Pagos Service",
    description="Microservicio de gestion de pagos de Warlus CRM",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


def _serializar(pago: Pago) -> dict:
    return {
        "id": pago.id,
        "pedido_id": pago.pedido_id,
        "monto": str(pago.monto),
        "metodo": pago.metodo,
        "estado": pago.estado,
        "created_at": (
            pago.created_at.isoformat()
            if pago.created_at
            else None
        ),
    }


def _obtener_o_404(
    pago_id: int,
    db: Session,
) -> Pago:

    pago = (
        db.query(Pago)
        .filter(Pago.id == pago_id)
        .first()
    )

    if pago is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Pago no encontrado"
        )

    return pago


@app.get("/")
def root():
    return {
        "message": "Microservicio de pagos Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "pagos",
        "status": "OK"
    }


@app.get("/health/db")
def health_db(
    db: Session = Depends(get_db),
):
    db.execute(text("SELECT 1"))

    return {
        "service": "pagos",
        "database": "OK"
    }


@app.get("/pagos")
def list_pagos(
    db: Session = Depends(get_db),
):
    pagos = db.query(Pago).all()

    return [
        _serializar(pago)
        for pago in pagos
    ]


@app.post("/pagos")
def create_pago(
    data: PagoCreate,
    db: Session = Depends(get_db),
):

    pago = Pago(
        pedido_id=data.pedido_id,
        monto=data.monto,
        metodo=data.metodo,
        estado=data.estado,
    )

    db.add(pago)
    db.commit()
    db.refresh(pago)

    return _serializar(pago)


@app.put("/pagos/{pago_id}")
def update_pago(
    pago_id: int,
    data: PagoCreate,
    db: Session = Depends(get_db),
):

    pago = _obtener_o_404(
        pago_id,
        db,
    )

    pago.pedido_id = data.pedido_id
    pago.monto = data.monto
    pago.metodo = data.metodo
    pago.estado = data.estado

    db.commit()
    db.refresh(pago)

    return _serializar(pago)


@app.delete("/pagos/{pago_id}")
def delete_pago(
    pago_id: int,
    db: Session = Depends(get_db),
):

    pago = _obtener_o_404(
        pago_id,
        db,
    )

    db.delete(pago)
    db.commit()

    return {
        "message": "Pago eliminado"
    }