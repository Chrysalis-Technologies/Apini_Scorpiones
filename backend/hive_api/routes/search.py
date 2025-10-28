from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_session

router = APIRouter()


@router.get("/", response_model=List[schemas.SearchResult])
def search(
    q: str = Query(..., min_length=2),
    session: Session = Depends(get_session),
) -> List[schemas.SearchResult]:
    term = f"%{q.lower()}%"

    anchors = (
        session.query(models.Anchor)
        .filter(models.Anchor.name.ilike(term) | models.Anchor.description.ilike(term))
        .all()
    )
    items = (
        session.query(models.Item)
        .filter(models.Item.title.ilike(term) | models.Item.body.ilike(term))
        .all()
    )

    results: List[schemas.SearchResult] = []
    for anchor in anchors:
        results.append(
            schemas.SearchResult(
                id=anchor.id,
                type="anchor",
                title=anchor.name,
                snippet=anchor.description,
                anchor_id=anchor.anchor_id,
                zone_id=anchor.zone_id,
            )
        )
    for item in items:
        results.append(
            schemas.SearchResult(
                id=item.id,
                type=item.type.value,
                title=item.title,
                snippet=(item.body or "")[:200],
                anchor_id=item.anchor_id,
                zone_id=item.zone_id,
            )
        )
    if not results:
        raise HTTPException(status_code=404, detail="No results found")
    return results
