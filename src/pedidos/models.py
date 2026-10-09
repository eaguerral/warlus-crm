from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String(160), nullable=False)
    servicio_id = Column(Integer, nullable=False)
    estado = Column(String(40), default="pendiente", nullable=False)
    usuario_id = Column(Integer, nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )