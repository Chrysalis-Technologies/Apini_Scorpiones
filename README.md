# Hive Dashboard MVP

Hive Dashboard is a spatial-memory personal organization system that keeps every task, note, or breadcrumb tethered to a life **Zone** and its physical **Anchors**. The repository contains a FastAPI + PostgreSQL backend paired with a React + Vite + TypeScript PWA frontend. The goal is to let an interrupted workflow resume instantly by jumping back to the right anchor, zone, and breadcrumb context.

## Stack Overview
- **Backend**: FastAPI, SQLAlchemy, Alembic, PostgreSQL, API-key auth
- **Frontend**: React, Vite, TypeScript, Leaflet map shell, Installable PWA
- **Infra**: Docker Compose (defined outside this increment) wires backend, frontend, and Postgres

## Running the Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend reads configuration from `.env` (see `.env.example`). API requests must include the `X-API-Key` header.

## Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend expects `VITE_API_BASE_URL` and `VITE_API_KEY` in `.env` or the shell. It provides Command Center (`/`), Zone (`/zones/:zoneId`), and Anchor (`/anchors/:anchorId`) routes.

## Docker Note
Docker and docker-compose definitions exist or will be supplied separately. This increment focuses on application code; integrate the provided environment variables with your compose setup when available.
