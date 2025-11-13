from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class BreadcrumbBase(BaseModel):
    anchor_id: int


class BreadcrumbStart(BreadcrumbBase):
    pass


class BreadcrumbStop(BaseModel):
    breadcrumb_id: int | None = None


class BreadcrumbRead(BreadcrumbBase):
    id: int
    started_at: datetime
    last_action_at: datetime
    active: bool

    class Config:
        from_attributes = True
