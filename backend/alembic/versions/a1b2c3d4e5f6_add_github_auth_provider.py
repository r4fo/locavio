"""add github to authprovider enum

Revision ID: a1b2c3d4e5f6
Revises: 681f9c4a7fb4
Create Date: 2026-05-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '681f9c4a7fb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE authprovider ADD VALUE IF NOT EXISTS 'github'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    # Downgrade is a no-op; remove 'github' rows manually before running if needed.
    pass
