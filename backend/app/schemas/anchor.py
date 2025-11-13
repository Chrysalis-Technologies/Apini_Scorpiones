from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AnchorBase(BaseModel):
    zone_id: int
    anchor_id: str
    name: str
    description: str | None = None
    location_hint: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AnchorCreate(AnchorBase):
    pass


class AnchorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location_hint: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AnchorRead(AnchorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
