from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.post("/", response_model=schemas.ScanLogRead, status_code=status.HTTP_201_CREATED)
def log_scan(
    payload: schemas.ScanLogCreate, session: Session = Depends(get_session)
) -> models.ScanLog:
    anchor = (
        session.query(models.Anchor)
        .filter(models.Anchor.anchor_id == payload.anchor_id.upper())
        .first()
    )
    if not anchor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")
    scan = models.ScanLog(
        anchor=anchor,
        device=payload.device,
        location=payload.location,
    )
    session.add(scan)
    session.commit()
    session.refresh(scan)
    return scan
