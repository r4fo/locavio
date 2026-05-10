# Locavio

AI-powered location planner and travel community platform. Generate personalized itineraries, explore your city, and connect with local communities.

---

## Features

- **AI Itineraries** — Generate a full day plan in seconds based on your location, interests, and purpose
- **Interactive Map** — View all activities on a map with route visualization
- **Communities** — Create and join local communities, post updates, and comment
- **Multi-provider Auth** — Sign in with Google, GitHub, LinkedIn, or email
- **Two-Factor Authentication** — Optional email-based OTP for extra security
- **Multi-language** — English, French, Spanish, Arabic, Turkish
- **Activity Reviews** — Rate and review activities within your itineraries

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| i18n | react-i18next |
| Maps | Google Maps API |
| Auth | @react-oauth/google |

### Backend
| | |
|---|---|
| Framework | FastAPI (async) |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy 2 (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + OAuth2 |
| Validation | Pydantic v2 |
| Rate limiting | slowapi |

---

## Project Structure

```
locavio/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, database, security, dependencies
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic layer
│   │   └── routers/       # FastAPI route handlers
│   ├── alembic/           # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route-level components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client functions
│   │   ├── store/         # Zustand state stores
│   │   └── locales/       # i18n translation files
│   └── package.json
```

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Run migrations
alembic upgrade heads

# Start the server
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start the dev server
npm run dev
```

App available at `http://localhost:5173`

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | ✅ | Random 32+ char string for JWT signing. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth 2.0 client ID |
| `LINKEDIN_CLIENT_ID` | OAuth | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | OAuth | LinkedIn OAuth client secret |
| `GITHUB_CLIENT_ID` | OAuth | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | OAuth | GitHub OAuth client secret |
| `GEMINI_API_KEY` | AI | Google Gemini API key (AI itinerary generation) |
| `GOOGLE_MAPS_API_KEY` | Maps | Google Maps / Geocoding API key |
| `OPENCAGE_API_KEY` | Maps | OpenCage geocoding (alternative) |
| `FRONTEND_URL` | CORS | Frontend origin, e.g. `http://localhost:5173` |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend base URL, e.g. `http://127.0.0.1:8000` |
| `VITE_GOOGLE_CLIENT_ID` | OAuth | Same value as `GOOGLE_CLIENT_ID` in backend |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps | Google Maps JavaScript API key |

---

## Database Migrations

```bash
cd backend

# Apply all pending migrations
alembic upgrade heads

# Create a new migration after changing a model
alembic revision --autogenerate -m "describe your change"
alembic upgrade heads

# Roll back one step
alembic downgrade -1
```

> The project uses Supabase (hosted PostgreSQL). Running migrations locally applies them to the same database used in production since it's a single shared instance.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/google` | Google OAuth login |
| `POST` | `/api/v1/auth/register` | Email registration |
| `POST` | `/api/v1/auth/login` | Email login |
| `GET` | `/api/v1/communities/` | List communities |
| `POST` | `/api/v1/communities/` | Create a community |
| `POST` | `/api/v1/communities/{id}/join` | Join a community |
| `GET` | `/api/v1/communities/{id}/posts` | Get community posts |
| `POST` | `/api/v1/communities/{id}/posts` | Create a post |
| `POST` | `/api/v1/communities/{id}/posts/{post_id}/comments` | Add a comment |
| `GET` | `/api/v1/itineraries/` | List itineraries |
| `POST` | `/api/v1/itineraries/` | Create itinerary (manual or AI) |

Full interactive documentation: `http://localhost:8000/docs`

---

## Deployment

- **Frontend** — Deployed on [Vercel](https://vercel.com). Set `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` in Vercel environment variables.
- **Backend** — Can be deployed on Railway, Render, or any platform supporting Python. Set all backend environment variables in the platform dashboard.
- **Database** — Hosted on [Supabase](https://supabase.com). No separate production database setup needed.

---

## License

MIT
