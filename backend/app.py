from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hive_api.db import create_all
from hive_api.routes.anchors import router as anchors_router
from hive_api.routes.breadcrumbs import router as breadcrumbs_router
from hive_api.routes.captures import router as captures_router
from hive_api.routes.items import router as items_router
from hive_api.routes.routesets import router as routesets_router
from hive_api.routes.scans import router as scans_router
from hive_api.routes.search import router as search_router
from hive_api.routes.zones import router as zones_router
from hive_api.settings import get_settings

app = FastAPI(title="Hive API", version="0.1.0")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    create_all()


@app.get("/healthz", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(zones_router, prefix="/api/zones", tags=["zones"])
app.include_router(anchors_router, prefix="/api/anchors", tags=["anchors"])
app.include_router(items_router, prefix="/api/items", tags=["items"])
app.include_router(captures_router, prefix="/api/captures", tags=["captures"])
app.include_router(breadcrumbs_router, prefix="/api/breadcrumbs", tags=["breadcrumbs"])
app.include_router(routesets_router, prefix="/api/routesets", tags=["routesets"])
app.include_router(scans_router, prefix="/api/scan", tags=["scans"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
