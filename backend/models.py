from __future__ import annotations

from sqlalchemy import Integer, String, Float, BigInteger, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Stock(Base):
    __tablename__ = "stocks"
    __table_args__ = (
        # Composite index to speed filtering by trade_code and sorting by date
        Index("ix_stocks_trade_code_date", "trade_code", "date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # JSON fields
    date: Mapped[str] = mapped_column(String(32), index=True)
    trade_code: Mapped[str] = mapped_column(String(32), index=True)
    high: Mapped[float | None] = mapped_column(Float, nullable=True)
    low: Mapped[float | None] = mapped_column(Float, nullable=True)
    open: Mapped[float | None] = mapped_column(Float, nullable=True)
    close: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
