from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    DATABASE_URL: str
    HIVE_API_KEY: str
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    database_url = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://hive:hive@localhost:5432/hive"
    )
    hive_api_key = os.getenv("HIVE_API_KEY", "change-me")
    backend_host = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port_raw = os.getenv("BACKEND_PORT", "8000")

    try:
        backend_port = int(backend_port_raw)
    except ValueError as exc:  # pragma: no cover - config error
        raise ValueError("BACKEND_PORT must be an integer") from exc

    return Settings(
        DATABASE_URL=database_url,
        HIVE_API_KEY=hive_api_key,
        BACKEND_HOST=backend_host,
        BACKEND_PORT=backend_port,
    )


settings = get_settings()
