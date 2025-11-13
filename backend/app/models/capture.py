from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Capture(Base):
    __tablename__ = "captures"

    id: Mapped[int] = mapped_column(primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text(), nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="text")
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"))
    anchor_id: Mapped[int | None] = mapped_column(ForeignKey("anchors.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    zone: Mapped["Zone | None"] = relationship(back_populates="captures")
    anchor: Mapped["Anchor | None"] = relationship(back_populates="captures")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Capture(id={self.id}, source='{self.source}')"
