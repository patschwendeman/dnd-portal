"""adventure and player; scenes belong to an adventure

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-17 21:49:02.532975

Adds the tables `adventure` and `player` and the column `scene.adventure_id` (NOT NULL).
Existing scenes are assigned to the adventure of the seed, which is only created if `scene` has rows (on an empty DB
the seeder creates it). Players are left to the seeder. The FK `adventure.active_scene_id` -> `scene.id` is created
last because of the circular reference adventure <-> scene.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Same values as the adventure in app/db/data/seed_data.json.
SEED_ADVENTURE_NAME = "Erstes Abenteuer"
SEED_ADVENTURE_DESCRIPTION = "Das erste Abenteuer"


def upgrade() -> None:
    conn = op.get_bind()

    adventure = op.create_table(
        "adventure",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("global_level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("active_scene_id", sa.Integer(), nullable=True),
        sa.CheckConstraint("global_level BETWEEN 1 AND 20", name=op.f("ck_adventure_global_level")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_adventure")),
    )
    op.create_table(
        "player",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("adventure_id", sa.Integer(), nullable=False),
        sa.Column("player_name", sa.String(), nullable=False),
        sa.Column("character_name", sa.String(), nullable=False),
        sa.Column("race", sa.String(), nullable=False),
        sa.Column("character_class", sa.String(), nullable=False),
        sa.Column("avatar_media_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["adventure_id"], ["adventure.id"], name=op.f("fk_player_adventure_id_adventure")),
        sa.ForeignKeyConstraint(["avatar_media_id"], ["media.id"], name=op.f("fk_player_avatar_media_id_media")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_player")),
    )

    op.add_column("scene", sa.Column("adventure_id", sa.Integer(), nullable=True))
    if conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM scene)")).scalar_one():
        adventure_id = conn.execute(
            sa.insert(adventure)
            .values(name=SEED_ADVENTURE_NAME, description=SEED_ADVENTURE_DESCRIPTION, global_level=1)
            .returning(adventure.c.id)
        ).scalar_one()
        conn.execute(sa.text("UPDATE scene SET adventure_id = :id"), {"id": adventure_id})
    op.alter_column("scene", "adventure_id", nullable=False)
    op.create_foreign_key(op.f("fk_scene_adventure_id_adventure"), "scene", "adventure", ["adventure_id"], ["id"])

    op.create_foreign_key(
        op.f("fk_adventure_active_scene_id_scene"),
        "adventure",
        "scene",
        ["active_scene_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_adventure_active_scene_id_scene"), "adventure", type_="foreignkey")
    op.drop_constraint(op.f("fk_scene_adventure_id_adventure"), "scene", type_="foreignkey")
    op.drop_column("scene", "adventure_id")
    op.drop_table("player")
    op.drop_table("adventure")
