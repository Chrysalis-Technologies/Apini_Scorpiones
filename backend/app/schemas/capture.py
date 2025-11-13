from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CaptureCreate(BaseModel):
    raw_text: str
    source: str = "text"
    zone_id: int | None = None
    anchor_id: int | None = None


class CaptureRead(CaptureCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
