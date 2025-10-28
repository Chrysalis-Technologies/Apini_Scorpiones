# Hive Dashboard

This workspace hosts the Hive dashboard MVP (FastAPI backend + React/Vite frontend) that mirrors spatial memory workflows with zones, anchors, and breadcrumbs.

- `backend/` — FastAPI application, SQLAlchemy models, Alembic migrations, seed helpers.
- `frontend/` — React + Vite client with Hive map, zone + anchor views, and PWA shell.
- `docs/` — planning blueprint, anchor seed CSV.
- `scripts/seed.py` — helper to seed zones and anchors via the API.

## Getting started

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
alembic -c backend/alembic.ini upgrade head
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` for the Hive map and `http://localhost:8000/docs` for the API explorer.
