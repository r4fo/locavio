from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_language
from app.models.user import User
from app.schemas.post import CommentCreate, CommentResponse, PostCreate, PostResponse
from app.services import community_service, post_service

router = APIRouter(prefix="/api/v1/communities", tags=["Posts"])


@router.get("/{community_id}/posts", response_model=list[PostResponse])
async def list_posts(
    community_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return await post_service.get_posts(db, community_id, page, limit)


@router.post(
    "/{community_id}/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post(
    community_id: int,
    data: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return await post_service.create_post(db, community_id, current_user.id, data)


@router.post(
    "/{community_id}/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    community_id: int,
    post_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    language: str = Depends(get_language),
):
    post = await post_service.get_post(db, post_id)
    if post is None or post.community_id != community_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return await post_service.create_comment(db, post_id, current_user.id, data)