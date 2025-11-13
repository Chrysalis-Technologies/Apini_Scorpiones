from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ZoneBase(BaseModel):
    name: str
    slug: str
    color: str | None = None
    description: str | None = None


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    color: str | None = None
    description: str | None = None


class ZoneRead(ZoneBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
