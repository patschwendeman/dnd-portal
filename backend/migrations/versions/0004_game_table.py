"""game table: state shared by Admin, Wall and Ground

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-17 23:54:39.972960

Adds the table `game_table` with exactly one row (`id = 1`): the active adventure (the one with the smallest ID, or
NULL without adventures) and the theme `dark`. The active scene stays in `adventure.active_scene_id`.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "game_table",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("active_adventure_id", sa.Integer(), nullable=True),
        sa.Column("theme", sa.Text(), server_default="dark", nullable=False),
        sa.CheckConstraint("theme IN ('dark', 'tavern')", name=op.f("ck_game_table_theme")),
        sa.CheckConstraint("id = 1", name=op.f("ck_game_table_single_row")),
        sa.ForeignKeyConstraint(
            ["active_adventure_id"],
            ["adventure.id"],
            name=op.f("fk_game_table_active_adventure_id_adventure"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_game_table")),
    )
    op.execute(
        "INSERT INTO game_table (id, active_adventure_id, theme) VALUES (1, (SELECT min(id) FROM adventure), 'dark')"
    )


def downgrade() -> None:
    op.drop_table("game_table")
