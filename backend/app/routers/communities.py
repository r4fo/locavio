from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_language, require_role
from app.models.membership import MembershipRole
from app.models.user import User
from app.schemas.community import CommunityCreate, CommunityResponse, CommunityUpdate
from app.schemas.membership import MembershipResponse
from app.services import community_service

router = APIRouter(prefix="/api/v1/communities", tags=["Communities"])


def _community_response(row) -> CommunityResponse:
    community, member_count = row
    resp = CommunityResponse.model_validate(community)
    resp.member_count = member_count
    return resp


@router.get("/", response_model=list[CommunityResponse])
async def list_communities(
    location: str | None = None,
    category: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    language: str = Depends(get_language),
):
    rows = await community_service.list_communities(
        db, location, category, search, page, limit, language
    )
    return [_community_response(row) for row in rows]


@router.post("/", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    data: CommunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    community = await community_service.create_community(db, current_user.id, data, language)
    row = await community_service.get_community(db, community.id, language)
    return _community_response(row)


@router.get("/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: int,
    db: AsyncSession = Depends(get_db),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return _community_response(row)


@router.put("/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: int,
    data: CommunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    community, _ = row
    membership = await community_service.get_membership(db, current_user.id, community_id)
    is_admin = membership and membership.role in (MembershipRole.admin, MembershipRole.moderator)
    is_creator = community.created_by == current_user.id

    if not is_creator and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updated = await community_service.update_community(db, community, data, language)
    new_row = await community_service.get_community(db, updated.id, language)
    return _community_response(new_row)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community(
    community_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    community, _ = row
    is_admin = current_user.role == "admin"
    if community.created_by != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this community",
        )
    await community_service.delete_community(db, community)


@router.post("/{community_id}/join", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
async def join_community(
    community_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user", "admin")),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    existing = await community_service.get_membership(db, current_user.id, community_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already a member of this community"
        )

    try:
        membership = await community_service.join_community(db, current_user.id, community_id, language)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already a member of this community"
        )
    return membership


@router.delete("/{community_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_community(
    community_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    language: str = Depends(get_language),
):
    found = await community_service.leave_community(db, current_user.id, community_id)
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found"
        )


@router.get("/{community_id}/members", response_model=list[MembershipResponse])
async def list_members(
    community_id: int,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    language: str = Depends(get_language),
):
    row = await community_service.get_community(db, community_id, language)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return await community_service.get_members(db, community_id, page, limit, language)
