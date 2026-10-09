from pydantic import BaseModel, Field


class PagoCreate(BaseModel):
    pedido_id: int = Field(gt=0)
    monto: float = Field(gt=0, le=1000000)
    metodo: str = Field(min_length=2, max_length=50)
    estado: str = Field(default="pendiente", min_length=2, max_length=40)