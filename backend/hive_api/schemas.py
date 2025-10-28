from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .models import (
    CaptureSource,
    DeviceType,
    ItemStatus,
    ItemType,
)


class ZoneBase(BaseModel):
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    slug: str


class ZoneCreate(ZoneBase):
    pass


class ZoneRead(ZoneBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AnchorBase(BaseModel):
    zone_id: Optional[str] = None
    anchor_id: str = Field(..., max_length=200)
    name: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    floorplan_ref: Optional[str] = None
    coords: Optional[dict] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class AnchorCreate(AnchorBase):
    pass


class AnchorRead(AnchorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ItemBase(BaseModel):
    zone_id: Optional[str] = None
    anchor_id: Optional[str] = None
    type: ItemType
    title: str
    body: Optional[str] = None
    status: ItemStatus = ItemStatus.open
    priority: Optional[int] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    status: Optional[ItemStatus] = None
    priority: Optional[int] = None
    zone_id: Optional[str] = None
    anchor_id: Optional[str] = None


class ItemRead(ItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CaptureCreate(BaseModel):
    raw_text: str
    source: CaptureSource
    location: Optional[str] = None
    inferred_anchor_id: Optional[str] = None
    inferred_zone_id: Optional[str] = None


class CaptureRead(CaptureCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class BreadcrumbStart(BaseModel):
    anchor_id: str


class BreadcrumbRead(BaseModel):
    id: str
    anchor_id: str
    started_at: datetime
    last_action_at: datetime
    active: bool

    class Config:
        orm_mode = True


class RouteSetBase(BaseModel):
    name: str
    description: Optional[str] = None
    anchor_ids: List[str] = Field(default_factory=list)


class RouteSetCreate(RouteSetBase):
    pass


class RouteSetRead(RouteSetBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ScanLogCreate(BaseModel):
    anchor_id: str
    device: DeviceType
    location: Optional[str] = None


class ScanLogRead(ScanLogCreate):
    id: str
    at: datetime

    class Config:
        orm_mode = True


class MoodLogCreate(BaseModel):
    zone_id: str
    mood: int
    energy: int


class MoodLogRead(MoodLogCreate):
    id: str
    at: datetime

    class Config:
        orm_mode = True


class SearchResult(BaseModel):
    id: str
    type: str
    title: str
    snippet: Optional[str] = None
    anchor_id: Optional[str] = None
    zone_id: Optional[str] = None
