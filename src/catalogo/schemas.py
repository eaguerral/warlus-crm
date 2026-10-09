from pydantic import BaseModel, Field


class ServicioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: float = Field(gt=0, le=1000000)
    activo: bool = True