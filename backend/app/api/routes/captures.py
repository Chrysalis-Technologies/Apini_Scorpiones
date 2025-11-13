from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.anchor import Anchor
from app.models.capture import Capture
from app.models.user import User
from app.models.zone import Zone
from app.schemas.capture import CaptureCreate, CaptureRead

router = APIRouter()


@router.get("/", response_model=list[CaptureRead])
def list_captures(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[Capture]:
    captures = (
        db.query(Capture).order_by(Capture.created_at.desc()).limit(50).all()
    )
    return [capture for capture in captures if _has_access(capture, current_user)]


@router.post("/", response_model=CaptureRead, status_code=status.HTTP_201_CREATED)
def create_capture(
    capture_in: CaptureCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Capture:
    _validate_scope(capture_in.zone_id, capture_in.anchor_id, current_user, db)
    capture = Capture(**capture_in.model_dump())
    db.add(capture)
    db.commit()
    db.refresh(capture)
    return capture


def _has_access(capture: Capture, current_user: User) -> bool:
    if capture.zone and capture.zone.owner_id != current_user.id:
        return False
    if capture.anchor and capture.anchor.zone.owner_id != current_user.id:
        return False
    return True


def _validate_scope(
    zone_id: int | None,
    anchor_id: int | None,
    current_user: User,
    db: Session,
) -> None:
    if zone_id is not None:
        zone = (
            db.query(Zone)
            .filter(Zone.id == zone_id, Zone.owner_id == current_user.id)
            .first()
        )
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    if anchor_id is not None:
        anchor = (
            db.query(Anchor)
            .join(Zone)
            .filter(Anchor.id == anchor_id, Zone.owner_id == current_user.id)
            .first()
        )
        if anchor is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")
