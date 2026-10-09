from pydantic import BaseModel


class PagoCreate(BaseModel):
    pedido_id: int
    monto: float
    metodo: str
    estado: str = "pendiente"
