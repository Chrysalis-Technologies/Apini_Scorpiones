from __future__ import annotations

from contextlib import contextmanager
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.anchor import Anchor
from app.models.user import User
from app.models.zone import Zone

DEFAULT_ZONES = [
    {
        "name": "Command Center",
        "slug": "command-center",
        "color": "#F59E0B",
        "description": "Inbox triage and unsorted captures",
    },
    {
        "name": "Work",
        "slug": "work",
        "color": "#2563EB",
        "description": "Client and deep work anchors",
    },
    {
        "name": "Home",
        "slug": "home",
        "color": "#10B981",
        "description": "Household routines and maintenance",
    },
]

DEFAULT_ANCHORS = [
    {
        "anchor_id": "HQ-OFFICE-DESK-01",
        "name": "Command Desk",
        "zone_slug": "command-center",
        "description": "Primary workstation with NFC tag",
        "location_hint": "Office desk",
    },
    {
        "anchor_id": "HOME-KITCHEN-COUNTER-01",
        "name": "Kitchen Launchpad",
        "zone_slug": "home",
        "description": "Family command center",
        "location_hint": "Kitchen counter",
    },
    {
        "anchor_id": "WORK-STUDIO-WALL-01",
        "name": "Studio Wall",
        "zone_slug": "work",
        "description": "Task wall for active client projects",
        "location_hint": "Studio whiteboard",
    },
]


@contextmanager
def session_scope() -> Session:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover - script level guard
        session.rollback()
        raise
    finally:
        session.close()


def seed() -> None:
    with session_scope() as session:
        user = _ensure_admin_user(session)
        zone_map = _ensure_zones(session, user)
        _ensure_anchors(session, zone_map)
    print("Seed completed.")  # noqa: T201


def _ensure_admin_user(session: Session) -> User:
    user = session.query(User).filter(User.email == "admin@hive.local").first()
    if user:
        return user

    user = User(email="admin@hive.local", full_name="Hive Admin", is_active=True)
    session.add(user)
    session.flush()
    return user


def _ensure_zones(session: Session, user: User) -> dict[str, Zone]:
    zone_map: dict[str, Zone] = {}
    for payload in DEFAULT_ZONES:
        zone = session.query(Zone).filter(Zone.slug == payload["slug"]).first()
        if not zone:
            zone = Zone(owner_id=user.id, **payload)
            session.add(zone)
            session.flush()
        zone_map[payload["slug"]] = zone
    return zone_map


def _ensure_anchors(session: Session, zones: dict[str, Zone]) -> None:
    for payload in DEFAULT_ANCHORS:
        zone = zones[payload["zone_slug"]]
        exists = session.query(Anchor).filter(Anchor.anchor_id == payload["anchor_id"]).first()
        if exists:
            continue
        anchor = Anchor(
            zone_id=zone.id,
            anchor_id=payload["anchor_id"],
            name=payload["name"],
            description=payload["description"],
            location_hint=payload.get("location_hint"),
        )
        session.add(anchor)
        session.flush()


if __name__ == "__main__":
    seed()
