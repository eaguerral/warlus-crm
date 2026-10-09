from pydantic import BaseModel, Field


class PedidoCreate(BaseModel):
    cliente: str = Field(min_length=2, max_length=160)
    servicio_id: int = Field(gt=0)
    estado: str = Field(default="pendiente", min_length=2, max_length=40)