from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, Numeric, String

from database import Base


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    metodo = Column(String(50), nullable=False)
    estado = Column(String(40), default="pendiente", nullable=False)
    usuario_id = Column(Integer, nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )