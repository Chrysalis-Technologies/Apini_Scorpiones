from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.post("/start", response_model=schemas.BreadcrumbRead)
def start_breadcrumb(
    payload: schemas.BreadcrumbStart, session: Session = Depends(get_session)
) -> models.Breadcrumb:
    anchor = (
        session.query(models.Anchor)
        .filter(models.Anchor.anchor_id == payload.anchor_id.upper())
        .first()
    )
    if not anchor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor not found")

    session.query(models.Breadcrumb).filter(models.Breadcrumb.active.is_(True)).update(
        {"active": False, "last_action_at": _now()}
    )

    breadcrumb = models.Breadcrumb(
        anchor=anchor, active=True, started_at=_now(), last_action_at=_now()
    )
    session.add(breadcrumb)
    session.commit()
    session.refresh(breadcrumb)
    return breadcrumb


@router.post("/stop", response_model=schemas.BreadcrumbRead)
def stop_breadcrumb(
    payload: schemas.BreadcrumbStart, session: Session = Depends(get_session)
) -> models.Breadcrumb:
    breadcrumb = (
        session.query(models.Breadcrumb)
        .join(models.Anchor)
        .filter(
            models.Anchor.anchor_id == payload.anchor_id.upper(),
            models.Breadcrumb.active.is_(True),
        )
        .order_by(models.Breadcrumb.started_at.desc())
        .first()
    )
    if not breadcrumb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active breadcrumb found")
    breadcrumb.active = False
    breadcrumb.last_action_at = _now()
    session.add(breadcrumb)
    session.commit()
    session.refresh(breadcrumb)
    return breadcrumb


@router.get("/last", response_model=Optional[schemas.BreadcrumbRead])
def last_breadcrumb(session: Session = Depends(get_session)) -> Optional[models.Breadcrumb]:
    breadcrumb = (
        session.query(models.Breadcrumb)
        .order_by(models.Breadcrumb.last_action_at.desc())
        .first()
    )
    return breadcrumb
