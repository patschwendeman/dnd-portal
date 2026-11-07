"""adventure image and cyber theme: one image per adventure, themes independent of the adventure

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-07 10:00:00.000000

Renames the theme `dark` to `cyber` (stored value, CHECK constraint and default of `game_table.theme`). Replaces
`adventure.background_dark_media_id` and `adventure.background_tavern_media_id` by the optional column
`adventure.image_media_id` (foreign key to `media`); existing adventures get the image looked up by `storage_key` in
`media` (the seeder only fills empty tables and would not reach them), without it in `media` the column stays empty.
The downgrade restores `dark` and both background columns and fills them as `0006` does.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | Sequence[str] | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_IMAGE = "images/wall_screen/forest.jpg"
DEFAULT_BACKGROUNDS = {
    "background_dark_media_id": "images/wall_screen/fight.jpg",
    "background_tavern_media_id": "images/wall_screen/tavern.jpg",
}


def _set_media_by_storage_key(column: str, storage_key: str) -> None:
    op.execute(
        sa.text(f"UPDATE adventure SET {column} = (SELECT id FROM media WHERE storage_key = :storage_key)").bindparams(
            storage_key=storage_key
        )
    )


def _rename_theme(old: str, new: str) -> None:
    # The CHECK constraint allows only one of both names, so it is dropped while the row is rewritten.
    op.drop_constraint(op.f("ck_game_table_theme"), "game_table", type_="check")
    op.execute(sa.text("UPDATE game_table SET theme = :new WHERE theme = :old").bindparams(old=old, new=new))
    op.create_check_constraint(op.f("ck_game_table_theme"), "game_table", f"theme IN ('{new}', 'tavern')")
    op.alter_column("game_table", "theme", server_default=new)


def upgrade() -> None:
    _rename_theme("dark", "cyber")
    op.add_column("adventure", sa.Column("image_media_id", sa.Integer(), nullable=True))
    op.create_foreign_key(op.f("fk_adventure_image_media_id_media"), "adventure", "media", ["image_media_id"], ["id"])
    _set_media_by_storage_key("image_media_id", DEFAULT_IMAGE)
    for column in DEFAULT_BACKGROUNDS:
        op.drop_constraint(op.f(f"fk_adventure_{column}_media"), "adventure", type_="foreignkey")
        op.drop_column("adventure", column)


def downgrade() -> None:
    for column, storage_key in DEFAULT_BACKGROUNDS.items():
        op.add_column("adventure", sa.Column(column, sa.Integer(), nullable=True))
        op.create_foreign_key(op.f(f"fk_adventure_{column}_media"), "adventure", "media", [column], ["id"])
        _set_media_by_storage_key(column, storage_key)
    op.drop_constraint(op.f("fk_adventure_image_media_id_media"), "adventure", type_="foreignkey")
    op.drop_column("adventure", "image_media_id")
    _rename_theme("cyber", "dark")
