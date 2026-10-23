"""scene without main: all scenes are equal

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-24 00:00:00.000000

Drops the column `scene.main` (battle vs. non-battle scene). Whether there is a fight no longer depends on the scene.
Scenes, images, tracks and the active scene stay as they are. The downgrade adds the column again (`NOT NULL`, default
`false`); the former split into battle and non-battle scenes is lost.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | Sequence[str] | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("scene", "main")


def downgrade() -> None:
    # The server default fills existing rows; it is dropped again, because the model of 0004 had none.
    op.add_column("scene", sa.Column("main", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.alter_column("scene", "main", server_default=None)
