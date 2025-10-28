from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def json_column() -> Column[dict]:
    try:
        return Column(JSON, default=dict)
    except TypeError:
        return Column(SQLiteJSON, default=dict)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ItemType(str, enum.Enum):
    task = "task"
    note = "note"


class ItemStatus(str, enum.Enum):
    open = "open"
    done = "done"


class CaptureSource(str, enum.Enum):
    voice = "voice"
    text = "text"
    nfc = "nfc"
    import_ = "import"


class DeviceType(str, enum.Enum):
    iphone = "iphone"
    watch = "watch"
    laptop = "laptop"


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Zone(Base, TimestampMixin):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20))
    icon: Mapped[Optional[str]] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    anchors: Mapped[list["Anchor"]] = relationship("Anchor", back_populates="zone")
    items: Mapped[list["Item"]] = relationship("Item", back_populates="zone")
    mood_logs: Mapped[list["MoodLog"]] = relationship("MoodLog", back_populates="zone")


class Anchor(Base, TimestampMixin):
    __tablename__ = "anchors"
    __table_args__ = (UniqueConstraint("anchor_id", name="uq_anchor_anchor_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"))
    anchor_id: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500))
    floorplan_ref: Mapped[Optional[str]] = mapped_column(String(200))
    coords: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
    tags: Mapped[list[str] | None] = mapped_column(JSON, default=list)

    zone: Mapped[Optional[Zone]] = relationship("Zone", back_populates="anchors")
    items: Mapped[list["Item"]] = relationship("Item", back_populates="anchor")
    breadcrumbs: Mapped[list["Breadcrumb"]] = relationship(
        "Breadcrumb", back_populates="anchor"
    )
    scan_logs: Mapped[list["ScanLog"]] = relationship(
        "ScanLog", back_populates="anchor"
    )


class Item(Base, TimestampMixin):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("zones.id"))
    anchor_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("anchors.id"))
    type: Mapped[ItemType] = mapped_column(Enum(ItemType), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus), default=ItemStatus.open, nullable=False
    )
    priority: Mapped[Optional[int]] = mapped_column(Integer)

    zone: Mapped[Optional[Zone]] = relationship("Zone", back_populates="items")
    anchor: Mapped[Optional[Anchor]] = relationship("Anchor", back_populates="items")


class Capture(Base, TimestampMixin):
    __tablename__ = "captures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[CaptureSource] = mapped_column(Enum(CaptureSource), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200))
    inferred_anchor_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("anchors.id")
    )
    inferred_zone_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("zones.id")
    )

    inferred_anchor: Mapped[Optional[Anchor]] = relationship("Anchor")
    inferred_zone: Mapped[Optional[Zone]] = relationship("Zone")


class Breadcrumb(Base):
    __tablename__ = "breadcrumbs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    anchor_id: Mapped[str] = mapped_column(String, ForeignKey("anchors.id"), index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_action_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    anchor: Mapped[Anchor] = relationship("Anchor", back_populates="breadcrumbs")


class RouteSet(Base, TimestampMixin):
    __tablename__ = "routesets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    anchor_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    anchor_id: Mapped[str] = mapped_column(String, ForeignKey("anchors.id"), index=True)
    device: Mapped[DeviceType] = mapped_column(Enum(DeviceType), nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    location: Mapped[Optional[str]] = mapped_column(String(200))

    anchor: Mapped[Anchor] = relationship("Anchor", back_populates="scan_logs")


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    zone_id: Mapped[str] = mapped_column(String, ForeignKey("zones.id"))
    mood: Mapped[int] = mapped_column(Integer, nullable=False)
    energy: Mapped[int] = mapped_column(Integer, nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    zone: Mapped[Zone] = relationship("Zone", back_populates="mood_logs")
