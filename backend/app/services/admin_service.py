"""Service layer for admin-only database operations."""

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.itinerary import Itinerary
from app.models.user import User, UserRole
from app.schemas.user import AdminUserUpdate


async def list_users(
    db: AsyncSession,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[User]:
    """List all users with optional email search filter."""
    query = select(User).order_by(User.created_at.desc())
    if search:
        query = query.where(User.email.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_users(db: AsyncSession) -> int:
    """Return total number of users."""
    result = await db.execute(select(func.count(User.id)))
    return result.scalar_one()


async def update_user_by_admin(
    db: AsyncSession,
    user: User,
    data: AdminUserUpdate,
) -> User:
    """Admin updates a user's role or active status."""
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Get a single user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """Return aggregate statistics for the admin dashboard."""
    # Total users
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar_one()

    # Active users (is_active=True)
    active_count = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)  # noqa: E712
    )
    active_users = active_count.scalar_one()

    # Admin users
    admin_count = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.admin)
    )
    total_admins = admin_count.scalar_one()

    # Total itineraries
    itin_count = await db.execute(select(func.count(Itinerary.id)))
    total_itineraries = itin_count.scalar_one()

    # Users by auth provider
    provider_query = await db.execute(
        select(User.auth_provider, func.count(User.id)).group_by(User.auth_provider)
    )
    auth_providers = {str(row[0].value): row[1] for row in provider_query.all()}

    # Recent users (last 7 days)
    from datetime import datetime, timedelta, timezone
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_count = await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )
    new_users_this_week = recent_count.scalar_one()

    # Top destinations (from itinerary data if destination column exists)
    top_destinations = []
    try:
        dest_query = await db.execute(
            select(Itinerary.destination, func.count(Itinerary.id))
            .group_by(Itinerary.destination)
            .order_by(func.count(Itinerary.id).desc())
            .limit(5)
        )
        top_destinations = [{"destination": row[0], "count": row[1]} for row in dest_query.all()]
    except Exception:
        pass  # Column might not exist yet

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_admins": total_admins,
        "total_itineraries": total_itineraries,
        "new_users_this_week": new_users_this_week,
        "auth_providers": auth_providers,
        "top_destinations": top_destinations,
    }


async def delete_user(db: AsyncSession, user: User) -> None:
    """Delete a user (admin action)."""
    await db.delete(user)
    await db.commit()


async def list_itineraries(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> list[Itinerary]:
    """List all itineraries for moderation."""
    query = (
        select(Itinerary)
        .order_by(Itinerary.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_itinerary(db: AsyncSession, itinerary: Itinerary) -> None:
    """Delete an itinerary (admin moderation)."""
    await db.delete(itinerary)
    await db.commit()


async def get_itinerary_by_id(db: AsyncSession, itinerary_id: int) -> Itinerary | None:
    """Get a single itinerary by ID."""
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    return result.scalar_one_or_none()
