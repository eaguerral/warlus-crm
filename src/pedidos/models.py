from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String, nullable=False)
    servicio_id = Column(Integer, nullable=False)
    estado = Column(String, default="pendiente", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
