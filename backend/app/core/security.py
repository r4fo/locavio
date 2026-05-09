import random
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
from jose import jwt as jose_jwt

from app.core.config import settings


# ── Password Hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT Tokens ────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a standard access token. 'data' should include sub (user id) and role."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jose_jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_pending_2fa_token(user_id: int) -> str:
    """Create a short-lived token (5 min) used between password check and 2FA verification.
    This token has scope='2fa_pending' so it cannot be used as a real access token."""
    return create_access_token(
        {"sub": str(user_id), "scope": "2fa_pending"},
        expires_delta=timedelta(minutes=5),
    )


def decode_access_token(token: str) -> dict:
    return jose_jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ── Google OAuth ──────────────────────────────────────────────────────────────

async def verify_google_token(token: str) -> dict:
    """Verify a Google ID token and return email, name, and picture."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise ValueError("Google token audience mismatch")

    return {
        "email": data["email"],
        "name": data.get("name", ""),
        "picture": data.get("picture", ""),
    }


# ── OTP (One-Time Password) for Email / SMS 2FA ──────────────────────────────

def generate_otp_code(length: int = 6) -> str:
    """Generate a random numeric OTP code (e.g. '482917')."""
    return "".join(random.choices(string.digits, k=length))


def otp_expiry_time(minutes: int = 5) -> datetime:
    """Return a UTC datetime 'minutes' from now, used as OTP expiration."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
