from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, Numeric, String

from database import Base


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    metodo = Column(String, nullable=False)
    estado = Column(String, default="pendiente", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
