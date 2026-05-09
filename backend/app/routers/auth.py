import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.limiter import limiter
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.core.security import (
    create_access_token,
    create_pending_2fa_token,
    decode_access_token,
    verify_google_token,
)
from app.models.user import AuthProvider, User
from app.schemas.user import UserResponse
from app.services import auth_service, linkedin_auth_service, github_auth_service, email_service

logger = logging.getLogger("locavio")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ── Request/Response Schemas ──────────────────────────────────────────────────

class TokenRequest(BaseModel):
    token: str


class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class CodeRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(BaseModel):
    """Returned by /login. Either a full auth response or a 2FA pending response."""
    access_token: str | None = None
    token_type: str = "bearer"
    user: UserResponse | None = None
    requires_2fa: bool = False
    pending_token: str | None = None


class Verify2FARequest(BaseModel):
    pending_token: str
    code: str


class TwoFAStatusResponse(BaseModel):
    totp_enabled: bool
    message: str


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.post("/google", response_model=AuthResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def google_auth(request: Request, body: TokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        google_data = await verify_google_token(body.token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    user = await auth_service.get_or_create_user(
        db=db,
        email=google_data["email"],
        name=google_data.get("name", ""),
        avatar_url=google_data.get("picture", ""),
        auth_provider=AuthProvider.google,
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Email Registration ────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def email_register(request: Request, body: EmailRegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_email_user(db, body.email, body.password, body.name or "")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Email Login (with 2FA support) ────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def email_login(request: Request, body: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate_email_user(db, body.email, body.password)

    # If user has 2FA enabled, don't give a real token yet
    if user.totp_enabled:
        # Generate and store an OTP code
        otp_code = await auth_service.set_otp_for_user(db, user)

        # In production, send this code via email/SMS.
        # For development, we log it to the console.
        logger.info(f"[2FA] OTP code for {user.email}: {otp_code}")
        print(f"\n{'='*50}")
        print(f"  2FA CODE for {user.email}: {otp_code}")
        print(f"{'='*50}\n")
        
        # Fire off the email in the background
        import asyncio
        asyncio.create_task(email_service.send_2fa_code(user.email, otp_code))

        pending_token = create_pending_2fa_token(user.id)
        return LoginResponse(
            requires_2fa=True,
            pending_token=pending_token,
        )

    # No 2FA — issue real token immediately
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return LoginResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


# ── 2FA Verification ─────────────────────────────────────────────────────────

@router.post("/verify-2fa", response_model=AuthResponse)
async def verify_2fa(body: Verify2FARequest, db: AsyncSession = Depends(get_db)):
    """Step 2 of the login flow: verify the 6-digit OTP code."""
    try:
        payload = decode_access_token(body.pending_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired pending token")

    if payload.get("scope") != "2fa_pending":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    from sqlalchemy.future import select
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify the OTP code
    is_valid = await auth_service.verify_otp_for_user(db, user, body.code)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired 2FA code")

    # Issue the real access token
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


# ── 2FA Setup Endpoints ──────────────────────────────────────────────────────

@router.post("/2fa/enable", response_model=TwoFAStatusResponse)
async def enable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable 2FA for the current user (email-based OTP)."""
    if current_user.auth_provider != AuthProvider.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is only available for email-registered accounts",
        )
    await auth_service.enable_2fa(db, current_user)
    return TwoFAStatusResponse(totp_enabled=True, message="2FA has been enabled. You will receive a code via email on your next login.")


@router.post("/2fa/disable", response_model=TwoFAStatusResponse)
async def disable_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA for the current user."""
    await auth_service.disable_2fa(db, current_user)
    return TwoFAStatusResponse(totp_enabled=False, message="2FA has been disabled.")


# ── LinkedIn OAuth ────────────────────────────────────────────────────────────

@router.get("/linkedin/url")
async def linkedin_auth_url(redirect_uri: str | None = None):
    """Return the LinkedIn OAuth authorization URL."""
    params = urlencode({
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": redirect_uri or f"{settings.FRONTEND_URL}/auth/linkedin/callback",
        "scope": "openid profile email",
    }, quote_via=__import__('urllib.parse', fromlist=['quote']).quote)
    return {"url": f"https://www.linkedin.com/oauth/v2/authorization?{params}"}


@router.post("/linkedin", response_model=AuthResponse)
@limiter.limit("5/minute")
async def linkedin_auth(request: Request, body: CodeRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user via LinkedIn authorization code exchange."""
    try:
        access_token = await linkedin_auth_service.exchange_code_for_token(body.code, body.redirect_uri)
        linkedin_data = await linkedin_auth_service.get_linkedin_user(access_token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[LinkedIn] Unexpected error during auth: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    user = await auth_service.get_or_create_user(
        db=db,
        email=linkedin_data["email"],
        name=linkedin_data["name"],
        avatar_url=linkedin_data["avatar_url"],
        auth_provider=AuthProvider.linkedin,
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


# ── GitHub OAuth ─────────────────────────────────────────────────────────────

@router.get("/github/url")
async def github_auth_url(redirect_uri: str | None = None):
    """Return the GitHub OAuth authorization URL."""
    params = urlencode({
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri or f"{settings.FRONTEND_URL}/auth/github/callback",
        "scope": "user:email",
    }, quote_via=__import__('urllib.parse', fromlist=['quote']).quote)
    return {"url": f"https://github.com/login/oauth/authorize?{params}"}


@router.post("/github", response_model=AuthResponse)
@limiter.limit("5/minute")
async def github_auth(request: Request, body: CodeRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user via GitHub authorization code exchange."""
    try:
        access_token = await github_auth_service.exchange_code_for_token(body.code, body.redirect_uri)
        github_data = await github_auth_service.get_github_user(access_token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[GitHub] Unexpected error during auth: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    user = await auth_service.get_or_create_user(
        db=db,
        email=github_data["email"],
        name=github_data["name"],
        avatar_url=github_data["avatar_url"],
        auth_provider=AuthProvider.github,
    )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


# ── Current User ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
