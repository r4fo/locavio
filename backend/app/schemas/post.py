from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuthorInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None
    avatar_url: str | None


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime | None
    author: AuthorInfo | None = None


class PostCreate(BaseModel):
    content: str
    image_url: str | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    user_id: int
    content: str
    image_url: str | None
    created_at: datetime
    updated_at: datetime | None
    author: AuthorInfo | None = None
    comments: list[CommentResponse] = []