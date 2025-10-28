# Hive Dashboard — Phases 1–3 Blueprint

## 0. Purpose and Product Ethos
- Anchor personal organisation in spatial memory: everything lives in a zone, anchor, or breadcrumb instead of flat lists.
- Deliver low-friction, gentle nudges over rigid scheduling so the user can re-engage contextually after interruptions.
- Optimise the laptop experience for the full hive map; keep the iPhone for ultra-fast capture and anchor scans; let the Apple Watch mirror key prompts.

## 1. Phase 1 — Hive Blueprint (Identity + Zones)
- **Zones (10 total)**  
  Command Center · Work · Home · Projects · Self · Dad · Jillian/Relationships · Family · Gouverneur · Cross-Pollination
- Design rules: favour specific, identity-based zones; let cross-zone references happen intentionally via the Cross-Pollination shelf.
- Capture flow: anything loose drops straight into the Command Center until re-indexed.
- Anchors: physical touchpoints resolved via NFC tags that deep link to anchor views (format `<REGION>-<ROOM>-<CONTAINER>-<SLOT>`).

## 2. Phase 2 — Habitat (Architecture + UX Plan)

### 2.1 Tech Stack (MVP)
- **Backend**: FastAPI + SQLAlchemy + Pydantic; SQLite during development with optional Azure SQL in production.
- **Frontend**: React + Vite (TypeScript). Lightweight state store via Zustand or Redux Toolkit.
- **Spatial UI**: Leaflet with image overlays for floorplans.
- **PWA**: Installable with manifest + Workbox-powered service worker; target iPhone quick access.
- Hosting: start with LAN-hosted instance (`my-hive.local`); keep data private with optional tunnel or cloud backup later.

### 2.2 Proposed Repository Structure
```
/hive
  /backend
    app.py
    /hive_api
      __init__.py
      models.py
      schemas.py
      /routes
        anchors.py
        zones.py
        items.py
        captures.py
        breadcrumbs.py
        routesets.py
        scans.py
      /services
        anchors.py
        notifications.py
        shortcuts.py
      db.py
      settings.py
      /migrations
  /frontend
    /src
      main.tsx
      App.tsx
      /components
        HiveMap.tsx
        ZoneTile.tsx
        ZoneView.tsx
        AnchorView.tsx
        BreadcrumbBar.tsx
        CaptureButton.tsx
        FloorplanMap.tsx
      /pages
        CommandCenter.tsx
        Zones.tsx
        Anchor.tsx
      /state
      /assets
      /pwa
        service-worker.ts
        manifest.webmanifest
    index.html
    vite.config.ts
  /docs
    README_PHASE_1-3.md
  /scripts
    seed.py
  .env.example
  Makefile
```

### 2.3 Data Model (Entities + Fields)
- **Zone**: `id`, `name`, `color`, `icon`, `description`, `slug`
- **Anchor**: `id`, `zone_id?`, `anchor_id` (human-readable, unique), `name`, `description`, `photo_url?`, `floorplan_ref?`, `coords?`, `tags[]`
- **Item**: `id`, `zone_id?`, `anchor_id?`, `type` (`task` | `note`), `title`, `body`, `status` (`open` | `done`), `priority?`, `created_at`, `updated_at`
- **Capture**: `id`, `raw_text`, `source` (`voice` | `text` | `nfc` | `import`), `created_at`, `location?`, `inferred_anchor_id?`, `inferred_zone_id?`
- **Breadcrumb**: `id`, `anchor_id`, `started_at`, `active` (bool), `last_action_at`
- **RouteSet**: `id`, `name`, `description`, `anchor_ids[]` (stored as JSON/text)
- **ScanLog**: `id`, `anchor_id`, `device` (`iphone` | `watch` | `laptop`), `at`, `location?`
- **MoodLog**: `id`, `zone_id`, `mood` (1–5), `energy` (1–5), `at`
- Constraints: `Anchor.anchor_id` unique index; timestamps default to `utcnow`.
- Migrations: init with Alembic; seed baseline zones and anchors.

### 2.4 API Surface (FastAPI)
- `GET /api/zones` — list zones
- `POST /api/zones` — create zone
- `GET /api/anchors?zone=<id>` — list anchors
- `GET /api/anchors/{anchor_id}` — fetch anchor by human-readable key
- `POST /api/anchors` — create or update anchor
- `POST /api/captures` — create capture payload
- `POST /api/breadcrumbs/start` — start breadcrumb `{ anchor_id }`
- `POST /api/breadcrumbs/stop` — stop breadcrumb `{ anchor_id }`
- `GET /api/breadcrumbs/last` — fetch last active breadcrumb
- `POST /api/routesets` — create or update anchor routes
- `POST /api/scan` — log NFC scan
- `POST /api/items` — create item/task/note
- `PATCH /api/items/{id}` — update status/body
- `GET /api/search?q=` — lightweight search across anchors/items
- Frontend deep link contract: `GET /anchor/:anchor_id` loads anchor view and triggers breadcrumb start.

### 2.5 Seed Data (Phase 2 Deliverable)
- Populate initial zones + 12 anchors (see Appendix A).
- `scripts/seed.py` posts seed data through the API.

## 3. Phase 3 — Interface Rules (MVP Behaviour)

### 3.1 Global UX Rules
- Captures enter the Command Center inbox unsorted; daily five-minute re-index assigns zone/anchor.
- Zones maintain independent cadence and widgets; only cross-link deliberately.
- Breadcrumb engine acts as anti-distraction anchor: one-tap “Where was I going?” returns to last active anchor.
- NFC scans deep link directly to anchor views with relevant checklists.

### 3.2 Per-Zone Widget Defaults
- **Command Center**: inbox list, quick tagger, “sort next” queue.
- **Work**: Kanban split into “High-focus bursts” vs “Low-focus admin”.
- **Home**: chores/errands with room tags (kitchen, garage, office).
- **Projects**: idea cards, quick log, “next tiny step”.
- **Self**: mood slider, energy check-in, habit counters.
- **Dad**: calendar snippets, kid notes, “one good memory today”.
- **Jillian / Relationships**: shared plans, date ideas, communication prompts.
- **Family**: birthdays, check-ins, contact notes.
- **Gouverneur**: farm tasks, up-north routines; anchors default when on matching Wi-Fi/geo.
- **Cross-Pollination**: freeform idea shelf linking back to other zones.

### 3.3 Frontend Components (React + Vite)
- **HiveMap**: 10 hex tiles; ambient pulse indicates activity; click-through to zones.
- **ZoneTile**: reusable tile with active/calm state.
- **ZoneView**: tabbed widgets (tasks, notes, anchors, mood for Self).
- **AnchorView**: shows anchor info, checklist filtered by anchor, photo, quick voice note, breadcrumb controls.
- **BreadcrumbBar**: global strip with “Where was I going?” CTA.
- **CaptureButton**: mobile-priority quick capture modal posting to `/api/captures`.
- **FloorplanMap** (optional MVP): Leaflet overlay with anchor markers and placement mode.
- Routing: `CommandCenter`, `Zones`, `Anchor` pages map to `/`, `/zones/:slug`, `/anchor/:anchor_id`.

### 3.4 Devices & PWA Behaviour
- iPhone: installable PWA with cached shell; quick capture modal; NFC deep links launch `/anchor/:id`.
- Apple Watch SE: receives notifications relayed from iOS Shortcuts; optional quick actions in future.
- Laptop: full hive dashboard with drag-and-drop between zones.
- Service worker caches shell + anchor routes; offline-friendly after first visit.

### 3.5 NFC + Shortcuts Integration
- Tag payload (Option A): URL record `https://my-hive.local/anchor/<ANCHOR_ID>`; replace host with LAN IP during dev.
- Tag payload (Option B fallback): text `ANCHOR:<ANCHOR_ID>` to map via Shortcut.
- iOS Shortcut per tag: trigger on NFC, open URL, show notification, optional location capture + POST `/api/scan`.
- Apple Watch mirrors the iPhone notification for wrist-first nudge.

### 3.6 Breadcrumb Contract
- Visiting `/anchor/:anchor_id` should call `POST /api/breadcrumbs/start`.
- “Found it” button in AnchorView calls `POST /api/breadcrumbs/stop`.
- BreadcrumbBar pulls `GET /api/breadcrumbs/last` to reopen context quickly.

## 4. Floorplan Overlay (Optional MVP)
- Store floorplan images under `frontend/src/assets/floorplans/<house>.png`.
- Use Leaflet `ImageOverlay` to render plan; anchor markers store coordinates as percentage offsets.
- Provide “Place anchor” mode for manual marker drop + save to anchor record.

## 5. Notifications & Nudges (MVP)
- Primary: iOS Shortcuts `Show Notification` on NFC scan (mirrors to Apple Watch).
- Secondary (post-MVP): enable Web Push within PWA after user opt-in.
- Abstract notification service in backend to swap delivery mechanisms later.

## 6. Security, Privacy, Offline
- Run locally on trusted devices; lock down CORS to LAN origins.
- Keep NFC payloads limited to anchor identifiers—no PII.
- Support optional TLS via Caddy/Nginx when exposing remotely.
- Ensure service worker caches anchor shell so deep links work when offline.

## 7. Developer Workflow
- **Backend setup**
  ```
  python -m venv .venv
  source .venv/bin/activate
  pip install fastapi uvicorn[standard] sqlalchemy alembic pydantic python-multipart
  alembic init backend/migrations
  alembic revision --autogenerate -m "init"
  alembic upgrade head
  uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
  ```
- `.env`: `DATABASE_URL=sqlite:///./hive.db`
- **Frontend setup**
  ```
  cd frontend
  npm create vite@latest hive-frontend -- --template react-ts
  cd hive-frontend
  npm install
  npm install leaflet zustand workbox-window
  npm run dev
  ```
- Configure Vite dev proxy to backend and add PWA manifest/service worker.
- **Makefile conveniences**
  ```
  dev:        # run backend + frontend concurrently
  migrate:    # run alembic
  seed:       # python scripts/seed.py
  ```

## 8. Acceptance Criteria (Phase 3 Complete)
- PWA installs on iPhone; landing on `https://my-hive.local` shows Hive Map with all 10 zones.
- `/anchor/<ANCHOR_ID>` loads AnchorView with checklist placeholder and breadcrumb controls.
- BreadcrumbBar “Where was I going?” reopens last active anchor.
- NFC tag tap resolves deep link within ~2 seconds; Shortcut triggers notification + optional scan log.
- Command Center capture accepts quick entry and retagging to zone/anchor.
- Data persists through restarts (anchors, items, breadcrumbs, captures).
- Optional: floorplan overlay renders and supports manual marker placement.

## 9. Recommended Implementation Order
1. Backend scaffolding: models, migrations, `/api/anchors/{id}`, breadcrumb API.
2. Seed zones + anchors; verify deep link contract locally.
3. Frontend routes: HiveMap → ZoneView → AnchorView with breadcrumb bar.
4. Capture flow and Command Center tagging.
5. iPhone NFC + Shortcut loop; confirm Apple Watch notifications.
6. PWA polish, offline caching, optional floorplan overlay.

## Appendix A — Initial Anchors CSV
```
anchor_id,friendly_label,zone
SYR-OFFICE-DRAWER-BOTTOMLEFT,"Office: Bottom-left drawer",Home
SYR-KITCHEN-JUNKDRAWER,"Kitchen: Junk drawer",Home
SYR-LAUNDRY-BASKET-A,"Laundry: Basket A",Home
SYR-GARAGE-TOOLBOX-01,"Garage: Toolbox 01 (top)",Home
SYR-GARAGE-TOOLBOX-02,"Garage: Toolbox 02 (bottom)",Home
GOUV-SHED-PAINT-SHELF,"Gouverneur: Shed paint shelf",Gouverneur
GOUV-FEED-BAG-STACK,"Gouverneur: Feed bag stack",Gouverneur
HOME-PILL-FILE-JILLIAN,"Jillian: Pill file",Relationships
HOME-DAD-MEMO-BOX,"Dad: Memo box",Dad
HOME-FAMILY-BIRTHDAY-CARD,"Family: Birthday card stash",Family
HOME-PROJECTS-3D-PLA-FILAMENT,"Projects: PLA filament",Projects
HOME-CROSSPOLL-SHELF,"Cross-pollination shelf",Cross-Pollination
```

## Appendix B — Example Anchor Payload
```
POST /api/anchors
Content-Type: application/json

{
  "anchor_id": "SYR-GARAGE-TOOLBOX-02",
  "name": "Garage: Toolbox 02 (bottom)",
  "zone_id": "<Home Zone ID>",
  "description": "Bottom tray; phillips & charger live here",
  "photo_url": null,
  "coords": null,
  "tags": ["garage", "tools", "screwdrivers"]
}
```

## Appendix C — Shortcut Recipe Per Tag
- Trigger: NFC scan; name automation with the exact `ANCHOR_ID`.
- Actions:
  1. Open URL `https://my-hive.local/anchor/<ANCHOR_ID>`
  2. Show notification `Anchor: <friendly label> — tap to open / log`
  3. Optional: Get current location.
  4. Optional: POST `/api/scan` with `{ "anchor_id": "<ANCHOR_ID>", "device": "iphone", "location": "<lat,long>" }`
- Turn off “Ask Before Running” so the routine fires immediately.

