from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ItemType(str, Enum):
    TASK = "task"
    NOTE = "note"


class ItemStatus(str, Enum):
    OPEN = "open"
    DONE = "done"


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"))
    anchor_id: Mapped[int | None] = mapped_column(ForeignKey("anchors.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text())
    type: Mapped[str] = mapped_column(String(16), default=ItemType.TASK.value)
    status: Mapped[str] = mapped_column(String(16), default=ItemStatus.OPEN.value)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    zone: Mapped["Zone | None"] = relationship(back_populates="items")
    anchor: Mapped["Anchor | None"] = relationship(back_populates="items")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Item(id={self.id}, title='{self.title}', status='{self.status}')"
