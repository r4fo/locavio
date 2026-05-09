# Locavio API

AI-powered location-based itinerary planner and community platform.

## Stack

- **Python 3.11+** / **FastAPI**
- **PostgreSQL** with **asyncpg** (async driver)
- **SQLAlchemy 2** async ORM
- **Alembic** migrations
- **Pydantic v2** + pydantic-settings
- JWT auth via python-jose + Google / Apple Sign In verification

## Quick start

```bash
# 1. Create and activate a virtual environment
python -m venv .venv && source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp ...env.example ...env
# edit ...env with real credentials

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn app.main:app --reload
```

API docs available at http://localhost:8000/docs

## Project structure

```
app/
  core/         config, database, security, dependencies
  models/       SQLAlchemy ORM models
  schemas/      Pydantic request/response schemas
  services/     Business logic (never in routers)
  routers/      FastAPI route handlers
  main.py       App factory + middleware
alembic/        Migration scripts
```

## Generating a new migration

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | Random secret for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `APPLE_CLIENT_ID` | Apple bundle ID / service ID |
| `APPLE_TEAM_ID` | Apple developer team ID |
| `APPLE_KEY_ID` | Apple Sign In key ID |
| `OPENCAGE_API_KEY` | Optional — enables geocoding |
| `DEFAULT_LANGUAGE` | Default language code (default: `en`) |
