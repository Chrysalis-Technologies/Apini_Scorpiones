from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.post(
    "/", response_model=schemas.ItemRead, status_code=status.HTTP_201_CREATED
)
def create_item(
    payload: schemas.ItemCreate, session: Session = Depends(get_session)
) -> models.Item:
    item = models.Item(**payload.dict())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.patch("/{item_id}", response_model=schemas.ItemRead)
def update_item(
    item_id: str, payload: schemas.ItemUpdate, session: Session = Depends(get_session)
) -> models.Item:
    item = session.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(item, field, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.get("/", response_model=List[schemas.ItemRead])
def list_items(
    zone_id: Optional[str] = Query(default=None),
    anchor_id: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
) -> List[models.Item]:
    query = session.query(models.Item)
    if zone_id:
        query = query.filter(models.Item.zone_id == zone_id)
    if anchor_id:
        query = query.filter(models.Item.anchor_id == anchor_id)
    return query.order_by(models.Item.created_at.desc()).all()
