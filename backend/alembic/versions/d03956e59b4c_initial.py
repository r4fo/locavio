"""initial schema (placeholder for pre-existing DB state)

Revision ID: d03956e59b4c
Revises:
Create Date: 2026-01-01

"""
from typing import Sequence, Union

revision: str = "d03956e59b4c"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass