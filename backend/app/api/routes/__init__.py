from __future__ import annotations

from fastapi import APIRouter

from . import anchors, breadcrumbs, captures, items, zones

api_router = APIRouter()
api_router.include_router(zones.router, prefix="/zones", tags=["zones"])
api_router.include_router(anchors.router, prefix="/anchors", tags=["anchors"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(captures.router, prefix="/captures", tags=["captures"])
api_router.include_router(breadcrumbs.router, prefix="/breadcrumbs", tags=["breadcrumbs"])

__all__ = ["api_router"]
