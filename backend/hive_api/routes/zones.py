from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.get("/", response_model=List[schemas.ZoneRead])
def list_zones(session: Session = Depends(get_session)) -> List[models.Zone]:
    return session.query(models.Zone).order_by(models.Zone.name).all()


@router.post(
    "/", response_model=schemas.ZoneRead, status_code=status.HTTP_201_CREATED
)
def create_zone(
    payload: schemas.ZoneCreate, session: Session = Depends(get_session)
) -> models.Zone:
    existing = (
        session.query(models.Zone)
        .filter((models.Zone.slug == payload.slug) | (models.Zone.name == payload.name))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Zone with the same slug or name already exists.",
        )
    zone = models.Zone(**payload.dict())
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone
