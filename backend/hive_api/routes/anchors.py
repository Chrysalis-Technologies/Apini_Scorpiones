from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.get("/", response_model=List[schemas.AnchorRead])
def list_anchors(
    zone_id: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
) -> List[models.Anchor]:
    query = session.query(models.Anchor)
    if zone_id:
        query = query.filter(models.Anchor.zone_id == zone_id)
    return query.order_by(models.Anchor.anchor_id).all()


@router.get("/{anchor_id}", response_model=schemas.AnchorRead)
def get_anchor(
    anchor_id: str, session: Session = Depends(get_session)
) -> models.Anchor:
    anchor = (
        session.query(models.Anchor)
        .filter(models.Anchor.anchor_id == anchor_id.upper())
        .first()
    )
    if not anchor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return anchor


@router.post(
    "/", response_model=schemas.AnchorRead, status_code=status.HTTP_201_CREATED
)
def create_or_update_anchor(
    payload: schemas.AnchorCreate, session: Session = Depends(get_session)
) -> models.Anchor:
    anchor_id = payload.anchor_id.upper()
    anchor = (
        session.query(models.Anchor).filter(models.Anchor.anchor_id == anchor_id).first()
    )
    payload_data = payload.dict(exclude={"anchor_id"})
    if anchor:
        for field, value in payload_data.items():
            setattr(anchor, field, value)
        session.add(anchor)
    else:
        anchor = models.Anchor(anchor_id=anchor_id, **payload_data)
        session.add(anchor)
    session.commit()
    session.refresh(anchor)
    return anchor
