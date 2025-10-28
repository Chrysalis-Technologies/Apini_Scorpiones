from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.post(
    "/", response_model=schemas.CaptureRead, status_code=status.HTTP_201_CREATED
)
def create_capture(
    payload: schemas.CaptureCreate, session: Session = Depends(get_session)
) -> models.Capture:
    capture = models.Capture(**payload.dict())
    session.add(capture)
    session.commit()
    session.refresh(capture)
    return capture


@router.get("/", response_model=List[schemas.CaptureRead])
def list_captures(session: Session = Depends(get_session)) -> List[models.Capture]:
    return session.query(models.Capture).order_by(models.Capture.created_at.desc()).all()
