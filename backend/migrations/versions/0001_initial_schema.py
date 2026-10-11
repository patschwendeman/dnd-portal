"""initial schema: wall_image, ground_image, track, scene, scene_track

Revision ID: 0001
Revises:
Create Date: 2026-10-11 12:29:03.919539

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ground_image",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ground_image")),
    )
    op.create_table(
        "track",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_track")),
    )
    op.create_table(
        "wall_image",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_wall_image")),
    )
    op.create_table(
        "scene",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("main", sa.Boolean(), nullable=False),
        sa.Column("wall_image_id", sa.Integer(), nullable=False),
        sa.Column("ground_image_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ground_image_id"], ["ground_image.id"], name=op.f("fk_scene_ground_image_id_ground_image")
        ),
        sa.ForeignKeyConstraint(["wall_image_id"], ["wall_image.id"], name=op.f("fk_scene_wall_image_id_wall_image")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_scene")),
        sa.UniqueConstraint("ground_image_id", name=op.f("uq_scene_ground_image_id")),
    )
    op.create_table(
        "scene_track",
        sa.Column("scene_id", sa.Integer(), nullable=False),
        sa.Column("track_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["scene_id"], ["scene.id"], name=op.f("fk_scene_track_scene_id_scene")),
        sa.ForeignKeyConstraint(["track_id"], ["track.id"], name=op.f("fk_scene_track_track_id_track")),
        sa.PrimaryKeyConstraint("scene_id", "track_id", name=op.f("pk_scene_track")),
    )


def downgrade() -> None:
    op.drop_table("scene_track")
    op.drop_table("scene")
    op.drop_table("wall_image")
    op.drop_table("track")
    op.drop_table("ground_image")
