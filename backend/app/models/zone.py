from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    color: Mapped[str | None] = mapped_column(String(32))
    description: Mapped[str | None] = mapped_column(Text())
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    owner: Mapped["User"] = relationship(back_populates="zones")
    anchors: Mapped[list["Anchor"]] = relationship(
        back_populates="zone", cascade="all, delete-orphan"
    )
    items: Mapped[list["Item"]] = relationship(
        back_populates="zone", cascade="all, delete-orphan"
    )
    captures: Mapped[list["Capture"]] = relationship(back_populates="zone")

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"Zone(id={self.id}, name='{self.name}')"
