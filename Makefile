PYTHON ?= python
PIP ?= pip
FRONTEND_DIR := frontend
BACKEND_DIR := backend

.PHONY: install-backend install-frontend dev-backend dev-frontend dev migrate seed

install-backend:
	cd $(BACKEND_DIR) && $(PIP) install -r requirements.txt

install-frontend:
	cd $(FRONTEND_DIR) && npm install

dev-backend:
	cd $(BACKEND_DIR) && uvicorn app:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd $(FRONTEND_DIR) && npm run dev -- --host

dev:
	$(MAKE) -j2 dev-backend dev-frontend

migrate:
	alembic -c $(BACKEND_DIR)/alembic.ini upgrade head

seed:
	$(PYTHON) scripts/seed.py
