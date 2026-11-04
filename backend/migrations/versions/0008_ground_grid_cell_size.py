"""ground grid cell size: stored on the game table

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-04 21:14:50.820189

Adds `game_table.ground_grid_cell_size` (cell size of the Ground grid in px, 100-200 in steps of 10, default 100),
so that it survives a restart of the API. The grid colour stays in memory. The downgrade drops the column.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | Sequence[str] | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("game_table", sa.Column("ground_grid_cell_size", sa.Integer(), server_default="100", nullable=False))
    op.create_check_constraint(
        op.f("ck_game_table_ground_grid_cell_size"),
        "game_table",
        "ground_grid_cell_size BETWEEN 100 AND 200 AND ground_grid_cell_size % 10 = 0",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_game_table_ground_grid_cell_size"), "game_table", type_="check")
    op.drop_column("game_table", "ground_grid_cell_size")
