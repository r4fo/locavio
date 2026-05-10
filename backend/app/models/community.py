from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, DECIMAL, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lat: Mapped[float | None] = mapped_column(DECIMAL(10, 6), nullable=True)
    lng: Mapped[float | None] = mapped_column(DECIMAL(10, 6), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    creator: Mapped["User | None"] = relationship("User", back_populates="communities")
    memberships: Mapped[list["Membership"]] = relationship(
        "Membership", back_populates="community", cascade="all, delete-orphan"
    )
    posts: Mapped[list["CommunityPost"]] = relationship(
        "CommunityPost", back_populates="community", cascade="all, delete-orphan"
    )


from app.models.user import User  # noqa: E402
from app.models.membership import Membership  # noqa: E402
from app.models.post import CommunityPost  # noqa: E402
