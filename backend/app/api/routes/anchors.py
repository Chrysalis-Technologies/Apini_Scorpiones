from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.anchor import Anchor
from app.models.user import User
from app.models.zone import Zone
from app.schemas.anchor import AnchorCreate, AnchorRead, AnchorUpdate

router = APIRouter()


@router.get("/", response_model=list[AnchorRead])
def list_anchors(
    zone_id: int | None = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[Anchor]:
    query = db.query(Anchor).join(Zone)
    query = query.filter(Zone.owner_id == current_user.id)
    if zone_id is not None:
        query = query.filter(Anchor.zone_id == zone_id)
    return query.order_by(Anchor.name.asc()).all()


@router.post("/", response_model=AnchorRead, status_code=status.HTTP_201_CREATED)
def create_anchor(
    anchor_in: AnchorCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Anchor:
    _ensure_zone_access(anchor_in.zone_id, current_user, db)
    anchor = Anchor(**anchor_in.model_dump())
    db.add(anchor)
    db.commit()
    db.refresh(anchor)
    return anchor


@router.get("/{anchor_key}", response_model=AnchorRead)
def get_anchor(
    anchor_key: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Anchor:
    anchor = (
        db.query(Anchor)
        .join(Zone)
        .filter(Anchor.anchor_id == anchor_key, Zone.owner_id == current_user.id)
        .first()
    )
    if anchor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")
    return anchor


@router.put("/{anchor_id}", response_model=AnchorRead)
def update_anchor(
    anchor_id: int,
    anchor_in: AnchorUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Anchor:
    anchor = (
        db.query(Anchor)
        .join(Zone)
        .filter(Anchor.id == anchor_id, Zone.owner_id == current_user.id)
        .first()
    )
    if anchor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")

    for key, value in anchor_in.model_dump(exclude_unset=True).items():
        setattr(anchor, key, value)

    db.add(anchor)
    db.commit()
    db.refresh(anchor)
    return anchor


@router.delete(
    "/{anchor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_anchor(
    anchor_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Response:
    anchor = (
        db.query(Anchor)
        .join(Zone)
        .filter(Anchor.id == anchor_id, Zone.owner_id == current_user.id)
        .first()
    )
    if anchor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")

    db.delete(anchor)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _ensure_zone_access(zone_id: int, current_user: User, db: Session) -> None:
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id, Zone.owner_id == current_user.id)
        .first()
    )
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
