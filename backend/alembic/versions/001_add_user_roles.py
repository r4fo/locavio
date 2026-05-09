"""add_user_roles

Revision ID: 001_add_user_roles
Revises:
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_add_user_roles"
down_revision: Union[str, None] = "d03956e59b4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type (PostgreSQL) then add the column.
    # For SQLite the enum is stored as VARCHAR, so we skip type creation.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        userrole_enum = sa.Enum("guest", "user", "admin", name="userrole")
        userrole_enum.create(bind, checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("guest", "user", "admin", name="userrole", native_enum=False),
            nullable=False,
            server_default="user",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sa.Enum(name="userrole").drop(bind, checkfirst=True)