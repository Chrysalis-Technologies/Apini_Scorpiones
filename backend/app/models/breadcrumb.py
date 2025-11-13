from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Breadcrumb(Base):
    __tablename__ = "breadcrumbs"

    id: Mapped[int] = mapped_column(primary_key=True)
    anchor_id: Mapped[int] = mapped_column(ForeignKey("anchors.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_action_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    anchor: Mapped["Anchor"] = relationship(back_populates="breadcrumbs")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Breadcrumb(id={self.id}, anchor_id={self.anchor_id}, active={self.active})"
