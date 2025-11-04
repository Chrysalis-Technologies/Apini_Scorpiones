from fastapi import APIRouter, HTTPException, Response
import requests

from hive_api.settings import get_settings

router = APIRouter()


@router.get("/feed", summary="Proxy the configured calendar feed")
def get_calendar_feed() -> Response:
    settings = get_settings()
    if not settings.calendar_feed_url:
        raise HTTPException(status_code=503, detail="Calendar feed not configured.")

    try:
        response = requests.get(settings.calendar_feed_url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Unable to fetch calendar feed.") from exc

    headers = {
        "Cache-Control": "no-store",
    }

    return Response(content=response.text, media_type="text/calendar", headers=headers)
