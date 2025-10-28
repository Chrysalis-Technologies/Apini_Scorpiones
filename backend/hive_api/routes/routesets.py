from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.get("/", response_model=List[schemas.RouteSetRead])
def list_routesets(session: Session = Depends(get_session)) -> List[models.RouteSet]:
    return session.query(models.RouteSet).order_by(models.RouteSet.name).all()


@router.post(
    "/", response_model=schemas.RouteSetRead, status_code=status.HTTP_201_CREATED
)
def create_routeset(
    payload: schemas.RouteSetCreate, session: Session = Depends(get_session)
) -> models.RouteSet:
    routeset = models.RouteSet(**payload.dict())
    session.add(routeset)
    session.commit()
    session.refresh(routeset)
    return routeset


@router.put("/{routeset_id}", response_model=schemas.RouteSetRead)
def update_routeset(
    routeset_id: str, payload: schemas.RouteSetCreate, session: Session = Depends(get_session)
) -> models.RouteSet:
    routeset = session.query(models.RouteSet).filter(models.RouteSet.id == routeset_id).first()
    if not routeset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    for field, value in payload.dict().items():
        setattr(routeset, field, value)
    session.add(routeset)
    session.commit()
    session.refresh(routeset)
    return routeset
