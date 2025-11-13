from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneRead, ZoneUpdate

router = APIRouter()


@router.get("/", response_model=list[ZoneRead])
def list_zones(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[Zone]:
    return (
        db.query(Zone)
        .filter(Zone.owner_id == current_user.id)
        .order_by(Zone.name.asc())
        .all()
    )


@router.post("/", response_model=ZoneRead, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone_in: ZoneCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Zone:
    zone = Zone(**zone_in.model_dump(), owner_id=current_user.id)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=ZoneRead)
def get_zone(
    zone_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Zone:
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id, Zone.owner_id == current_user.id)
        .first()
    )
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    return zone


@router.put("/{zone_id}", response_model=ZoneRead)
def update_zone(
    zone_id: int,
    zone_in: ZoneUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Zone:
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id, Zone.owner_id == current_user.id)
        .first()
    )
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    for key, value in zone_in.model_dump(exclude_unset=True).items():
        setattr(zone, key, value)

    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete(
    "/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_zone(
    zone_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Response:
    zone = (
        db.query(Zone)
        .filter(Zone.id == zone_id, Zone.owner_id == current_user.id)
        .first()
    )
    if zone is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    db.delete(zone)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
