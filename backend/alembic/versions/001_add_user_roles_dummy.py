"""dummy_no_op — placeholder, does nothing

Revision ID: b000dummy001
Revises: a1b2c3d4e5f6
Create Date: 2026-05-01 00:00:00.000000

This file exists only to prevent alembic from erroring on a stale duplicate.
It is a safe no-op and can be removed once the migration chain is cleaned up.
"""
from typing import Sequence, Union

revision: str = 'b000dummy001'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
