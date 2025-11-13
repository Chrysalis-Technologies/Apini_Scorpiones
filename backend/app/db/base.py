from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""


# Import models so Alembic can discover them.
from app.models import anchor, breadcrumb, capture, item, user, zone  # noqa: E402,F401
