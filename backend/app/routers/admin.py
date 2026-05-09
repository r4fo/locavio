"""Admin-only endpoints — all protected by get_current_active_admin."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_admin
from app.models.user import User
from app.schemas.itinerary import ItineraryResponse
from app.schemas.user import AdminUserUpdate, UserResponse
from app.services import admin_service

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


# ── User Management ──────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    search: str | None = Query(None, description="Filter users by email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users. Only accessible to admins."""
    return await admin_service.list_users(db, search=search, skip=skip, limit=limit)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role or active status. Only accessible to admins."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot modify your own admin account",
        )

    user = await admin_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return await admin_service.update_user_by_admin(db, user, data)


# ── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregate statistics for the admin dashboard."""
    return await admin_service.get_dashboard_stats(db)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user. Admins cannot delete their own account."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )
    user = await admin_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await admin_service.delete_user(db, user)


# ── Content Moderation ────────────────────────────────────────────────────────

@router.get("/itineraries", response_model=list[ItineraryResponse])
async def list_all_itineraries(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all itineraries for moderation. Only accessible to admins."""
    return await admin_service.list_itineraries(db, skip=skip, limit=limit)


@router.delete("/itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_itinerary(
    itinerary_id: int,
    admin: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete any itinerary (admin moderation). Only accessible to admins."""
    itinerary = await admin_service.get_itinerary_by_id(db, itinerary_id)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found")
    await admin_service.delete_itinerary(db, itinerary)
