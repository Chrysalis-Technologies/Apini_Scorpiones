from sqlalchemy.orm import Session

from .. import models


def ensure_anchor(session: Session, anchor_id: str) -> models.Anchor | None:
    return (
        session.query(models.Anchor)
        .filter(models.Anchor.anchor_id == anchor_id.upper())
        .first()
    )
