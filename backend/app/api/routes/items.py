from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.anchor import Anchor
from app.models.item import Item
from app.models.user import User
from app.models.zone import Zone
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter()


@router.get("/", response_model=list[ItemRead])
def list_items(
    zone_id: int | None = Query(default=None),
    anchor_id: int | None = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[Item]:
    query = db.query(Item).join(Zone, Item.zone_id == Zone.id, isouter=True)
    query = query.filter((Zone.owner_id == current_user.id) | (Zone.id.is_(None)))
    if zone_id is not None:
        query = query.filter(Item.zone_id == zone_id)
    if anchor_id is not None:
        query = query.filter(Item.anchor_id == anchor_id)
    return query.order_by(Item.created_at.desc()).all()


@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Item:
    _validate_scope(item_in.zone_id, item_in.anchor_id, current_user, db)
    item = Item(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(
    item_id: int,
    item_in: ItemUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Item:
    item = (
        db.query(Item)
        .join(Zone, Item.zone_id == Zone.id, isouter=True)
        .filter((Zone.owner_id == current_user.id) | (Zone.id.is_(None)))
        .filter(Item.id == item_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    payload = item_in.model_dump(exclude_unset=True)
    _validate_scope(payload.get("zone_id"), payload.get("anchor_id"), current_user, db)

    for key, value in payload.items():
        setattr(item, key, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_item(
    item_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Response:
    item = (
        db.query(Item)
        .join(Zone, Item.zone_id == Zone.id, isouter=True)
        .filter((Zone.owner_id == current_user.id) | (Zone.id.is_(None)))
        .filter(Item.id == item_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
