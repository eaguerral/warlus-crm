from pydantic import BaseModel


class ServicioCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: float
    activo: bool = True
