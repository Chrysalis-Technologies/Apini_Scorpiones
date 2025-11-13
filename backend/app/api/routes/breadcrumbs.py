from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.anchor import Anchor
from app.models.breadcrumb import Breadcrumb
from app.models.user import User
from app.models.zone import Zone
from app.schemas.breadcrumb import (
    BreadcrumbRead,
    BreadcrumbStart,
    BreadcrumbStop,
)

router = APIRouter()


@router.get("/", response_model=list[BreadcrumbRead])
def list_breadcrumbs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[Breadcrumb]:
    return (
        db.query(Breadcrumb)
        .join(Anchor)
        .join(Zone)
        .filter(Zone.owner_id == current_user.id)
        .order_by(Breadcrumb.started_at.desc())
        .limit(20)
        .all()
    )


@router.get("/current", response_model=BreadcrumbRead | None)
def current_breadcrumb(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Breadcrumb | None:
    return (
        db.query(Breadcrumb)
        .join(Anchor)
        .join(Zone)
        .filter(Zone.owner_id == current_user.id)
        .filter(Breadcrumb.active.is_(True))
        .first()
    )


@router.post("/start", response_model=BreadcrumbRead, status_code=status.HTTP_201_CREATED)
def start_breadcrumb(
    payload: BreadcrumbStart,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Breadcrumb:
    _ensure_anchor_access(payload.anchor_id, current_user, db)

    active = (
        db.query(Breadcrumb)
        .join(Anchor)
        .join(Zone)
        .filter(Zone.owner_id == current_user.id, Breadcrumb.active.is_(True))
        .all()
    )
    for crumb in active:
        crumb.active = False

    breadcrumb = Breadcrumb(anchor_id=payload.anchor_id, active=True)
    db.add(breadcrumb)
    db.commit()
    db.refresh(breadcrumb)
    return breadcrumb


@router.post("/stop", response_model=BreadcrumbRead | None)
def stop_breadcrumb(
    payload: BreadcrumbStop,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Breadcrumb | None:
    query = db.query(Breadcrumb).join(Anchor).join(Zone).filter(Zone.owner_id == current_user.id)
    if payload.breadcrumb_id is not None:
        query = query.filter(Breadcrumb.id == payload.breadcrumb_id)
    else:
        query = query.filter(Breadcrumb.active.is_(True))

    breadcrumb = query.first()
    if breadcrumb is None:
        return None

    breadcrumb.active = False
    db.add(breadcrumb)
    db.commit()
    db.refresh(breadcrumb)
    return breadcrumb


def _ensure_anchor_access(anchor_id: int, current_user: User, db: Session) -> None:
    anchor = (
        db.query(Anchor)
        .join(Zone)
        .filter(Anchor.id == anchor_id, Zone.owner_id == current_user.id)
        .first()
    )
    if anchor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")
