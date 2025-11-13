from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Anchor(Base):
    __tablename__ = "anchors"

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id", ondelete="CASCADE"))
    anchor_id: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text())
    location_hint: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    zone: Mapped["Zone"] = relationship(back_populates="anchors")
    items: Mapped[list["Item"]] = relationship(back_populates="anchor")
    breadcrumbs: Mapped[list["Breadcrumb"]] = relationship(
        back_populates="anchor", cascade="all, delete-orphan"
    )
    captures: Mapped[list["Capture"]] = relationship(back_populates="anchor")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Anchor(anchor_id='{self.anchor_id}', name='{self.name}')"
