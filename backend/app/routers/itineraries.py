from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_language, require_role
from app.models.itinerary import ItineraryPurpose, ItineraryStatus
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryGenerateRequest,
    ItineraryResponse,
    ItineraryUpdate,
)
from app.services import itinerary_service

router = APIRouter(prefix="/api/v1/itineraries", tags=["Itineraries"])


@router.get("/", response_model=list[ItineraryResponse])
async def list_itineraries(
    status: ItineraryStatus | None = None,
    purpose: ItineraryPurpose | None = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    language: str = Depends(get_language),
):
    return await itinerary_service.list_itineraries(
        db, current_user.id, status, purpose, page, limit, language
    )


@router.post("/generate", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def generate_itinerary(
    data: ItineraryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    return await itinerary_service.generate_ai_itinerary(db, current_user.id, data, language)


@router.post("/", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def create_itinerary(
    data: ItineraryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    return await itinerary_service.create_itinerary(db, current_user.id, data, language)


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    language: str = Depends(get_language),
):
    itinerary = await itinerary_service.get_itinerary(db, itinerary_id, language)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found")
    if itinerary.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return itinerary


@router.put("/{itinerary_id}", response_model=ItineraryResponse)
async def update_itinerary(
    itinerary_id: int,
    data: ItineraryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    itinerary = await itinerary_service.get_itinerary(db, itinerary_id, language)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found")
    if itinerary.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await itinerary_service.update_itinerary(db, itinerary, data, language)


@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    itinerary = await itinerary_service.get_itinerary(db, itinerary_id, language)
    if itinerary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found")
    if itinerary.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await itinerary_service.delete_itinerary(db, itinerary)
