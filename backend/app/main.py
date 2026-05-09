import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routers import auth, users, itineraries, activities, communities, reviews, admin
from app.core.limiter import limiter
from app.core.security_headers import SecurityHeadersMiddleware
from app.routers import admin, auth, users, itineraries, activities, communities, reviews

logger = logging.getLogger("locavio")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Locavio API started")
    yield


app = FastAPI(
    title="Locavio API",
    version="1.0.0",
    description="AI-powered location planner",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found"},
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors() if hasattr(exc, "errors") else str(exc)},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(itineraries.router)
app.include_router(activities.router)
app.include_router(communities.router)
app.include_router(reviews.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Locavio API", "docs": "/docs"}
