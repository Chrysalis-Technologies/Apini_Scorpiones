from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ItemType = Literal["task", "note"]
ItemStatus = Literal["open", "done"]


class ItemBase(BaseModel):
    title: str
    body: str | None = None
    type: ItemType = "task"
    status: ItemStatus = "open"
    zone_id: int | None = None
    anchor_id: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    status: ItemStatus | None = None
    zone_id: int | None = None
    anchor_id: int | None = None


class ItemRead(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
