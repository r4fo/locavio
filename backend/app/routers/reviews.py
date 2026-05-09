from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_language, require_role
from app.models.user import User
from app.schemas.review import ActivityReviewsResponse, ReviewCreate, ReviewResponse, ReviewUpdate
from app.services import review_service

router = APIRouter(prefix="/api/v1/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    existing = await review_service.get_review_by_user_activity(
        db, current_user.id, data.activity_id
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this activity",
        )

    try:
        review = await review_service.create_review(db, current_user.id, data, language)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this activity",
        )
    return review


@router.get("/activity/{activity_id}", response_model=ActivityReviewsResponse)
async def list_reviews_for_activity(
    activity_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    language: str = Depends(get_language),
):
    reviews, avg_rating = await review_service.list_reviews_for_activity(
        db, activity_id, page, limit, language
    )
    return ActivityReviewsResponse(
        reviews=reviews,
        avg_rating=avg_rating,
        total=len(reviews),
    )


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    review = await review_service.get_review(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await review_service.update_review(db, review, data, language)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    review = await review_service.get_review(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await review_service.delete_review(db, review)
