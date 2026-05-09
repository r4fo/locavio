from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.services.i18n_service import get_language as parse_language

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Extract the current user from the JWT Bearer token.
    Returns None if no token is provided or the token is invalid."""
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: int | None = payload.get("sub")
        if user_id is None:
            return None
        # Reject pending 2FA tokens — they should NOT grant access
        if payload.get("scope") == "2fa_pending":
            return None
    except JWTError:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    # If the user has been banned by an admin, deny access
    if user is not None and not user.is_active:
        return None

    return user


async def get_current_active_user(
    user: User | None = Depends(get_current_user),
) -> User:
    """Require an authenticated, active user. Raises 401 if not."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*roles: str):
    """Return a dependency that enforces the user has one of the specified roles."""
    async def _check_role(user: User = Depends(get_current_active_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return _check_role


require_admin = Depends(require_role("admin"))
require_user = Depends(require_role("user", "admin"))
async def get_current_active_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Require an authenticated user with the 'admin' role. Raises 403 if not an admin."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def get_language(accept_language: str = Header(default="en")) -> str:
    return parse_language(accept_language)
