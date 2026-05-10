from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.comment import PostComment
from app.models.post import CommunityPost
from app.schemas.post import CommentCreate, PostCreate


async def get_posts(
    db: AsyncSession, community_id: int, page: int = 1, limit: int = 20
) -> list[CommunityPost]:
    result = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.community_id == community_id)
        .options(
            selectinload(CommunityPost.author),
            selectinload(CommunityPost.comments).selectinload(PostComment.author),
        )
        .order_by(CommunityPost.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_post(db: AsyncSession, post_id: int) -> CommunityPost | None:
    result = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.id == post_id)
        .options(
            selectinload(CommunityPost.author),
            selectinload(CommunityPost.comments).selectinload(PostComment.author),
        )
    )
    return result.scalar_one_or_none()


async def create_post(
    db: AsyncSession, community_id: int, user_id: int, data: PostCreate
) -> CommunityPost:
    post = CommunityPost(
        community_id=community_id,
        user_id=user_id,
        content=data.content,
        image_url=data.image_url,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    result = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.id == post.id)
        .options(
            selectinload(CommunityPost.author),
            selectinload(CommunityPost.comments).selectinload(PostComment.author),
        )
    )
    return result.scalar_one()


async def create_comment(
    db: AsyncSession, post_id: int, user_id: int, data: CommentCreate
) -> PostComment:
    comment = PostComment(
        post_id=post_id,
        user_id=user_id,
        content=data.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    result = await db.execute(
        select(PostComment)
        .where(PostComment.id == comment.id)
        .options(selectinload(PostComment.author))
    )
    return result.scalar_one()
