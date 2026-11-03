"""adventure background: one image per theme behind the tiles of the Admin

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-03 19:49:17.219169

Adds the optional columns `adventure.background_dark_media_id` and `adventure.background_tavern_media_id` (foreign
keys to `media`). Existing adventures get the default images, looked up by `storage_key` in `media`; the seeder only
fills empty tables and would not reach them. Without the image in `media` the column stays empty. The downgrade drops
both columns.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | Sequence[str] | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_BACKGROUNDS = {
    "background_dark_media_id": "images/wall_screen/fight.jpg",
    "background_tavern_media_id": "images/wall_screen/tavern.jpg",
}


def upgrade() -> None:
    for column in DEFAULT_BACKGROUNDS:
        op.add_column("adventure", sa.Column(column, sa.Integer(), nullable=True))
        op.create_foreign_key(op.f(f"fk_adventure_{column}_media"), "adventure", "media", [column], ["id"])
    for column, storage_key in DEFAULT_BACKGROUNDS.items():
        op.execute(
            sa.text(
                f"UPDATE adventure SET {column} = (SELECT id FROM media WHERE storage_key = :storage_key)"
            ).bindparams(storage_key=storage_key)
        )


def downgrade() -> None:
    for column in DEFAULT_BACKGROUNDS:
        op.drop_constraint(op.f(f"fk_adventure_{column}_media"), "adventure", type_="foreignkey")
        op.drop_column("adventure", column)
