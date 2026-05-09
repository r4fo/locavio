import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import hash_password, verify_password, generate_otp_code, otp_expiry_time
from app.models.user import AuthProvider, User, UserRole
from app.schemas.user import UserCreate

logger = logging.getLogger("locavio")

# ── Admin seed email ─────────────────────────────────────────────────────────
# The first user to register with this email will automatically become admin.
# Change this to your real admin email address.
ADMIN_SEED_EMAIL = "admin12@locavio.com"


async def register_email_user(db: AsyncSession, email: str, password: str, name: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Auto-assign admin role if this is the seed admin email
    role = UserRole.admin if email.lower() == ADMIN_SEED_EMAIL.lower() else UserRole.user

    user = User(
        email=email,
        name=name or email.split("@")[0],
        avatar_url=None,
        auth_provider=AuthProvider.email,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if role == UserRole.admin:
        logger.info(f"Admin user seeded: {email}")

    return user


async def authenticate_email_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or user.password_hash is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")
    return user


async def get_or_create_user(
    db: AsyncSession,
    email: str,
    name: str,
    avatar_url: str,
    auth_provider: AuthProvider,
) -> User:
    """Fetch an existing user by email or create one if they don't exist.

    Args:
        db: Active database session.
        email: User's email address (unique identifier).
        name: Display name from the OAuth provider.
        avatar_url: Profile picture URL from the OAuth provider.
        auth_provider: Which OAuth provider authenticated the user.

    Returns:
        The existing or newly created User ORM instance.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-assign admin role if this is the seed admin email
        role = UserRole.admin if email.lower() == ADMIN_SEED_EMAIL.lower() else UserRole.user

        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            auth_provider=auth_provider,
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        if role == UserRole.admin:
            logger.info(f"Admin user seeded via OAuth: {email}")

    return user


# ── OTP (Email-based 2FA) helpers ─────────────────────────────────────────────

async def set_otp_for_user(db: AsyncSession, user: User) -> str:
    """Generate and store a 6-digit OTP code on the user record. Returns the code."""
    code = generate_otp_code()
    user.otp_code = code
    user.otp_expires_at = otp_expiry_time(minutes=5)
    await db.commit()
    await db.refresh(user)
    return code


async def verify_otp_for_user(db: AsyncSession, user: User, code: str) -> bool:
    """Check the OTP code against the stored one. Clears the OTP on success."""
    from datetime import datetime, timezone

    if user.otp_code is None or user.otp_expires_at is None:
        return False

    # Check expiry
    if datetime.now(timezone.utc) > user.otp_expires_at:
        # Expired — clear the code
        user.otp_code = None
        user.otp_expires_at = None
        await db.commit()
        return False

    if user.otp_code != code:
        return False

    # Success — clear the OTP so it can't be reused
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    await db.refresh(user)
    return True


async def enable_2fa(db: AsyncSession, user: User) -> None:
    """Enable 2FA for a user."""
    user.totp_enabled = True
    await db.commit()


async def disable_2fa(db: AsyncSession, user: User) -> None:
    """Disable 2FA for a user and clear any stored OTP."""
    user.totp_enabled = False
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
