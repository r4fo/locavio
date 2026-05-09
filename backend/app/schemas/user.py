from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import AuthProvider, UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None
    auth_provider: AuthProvider
    location: str | None = None
    preferences: dict | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    location: str | None = None
    preferences: dict | None = None


class UserRoleUpdate(BaseModel):
    role: Literal['guest', 'user', 'admin']


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None
    avatar_url: str | None
    auth_provider: AuthProvider
    role: UserRole
    is_active: bool
    totp_enabled: bool
    location: str | None
    preferences: dict | None
    created_at: datetime
    updated_at: datetime | None


class AdminUserUpdate(BaseModel):
    """Schema used by admins to change a user's role or active status."""
    role: UserRole | None = None
    is_active: bool | None = None
