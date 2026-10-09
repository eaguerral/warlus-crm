from pydantic import BaseModel


class PedidoCreate(BaseModel):
    cliente: str
    servicio_id: int
    estado: str = "pendiente"
