"""media table replaces wall_image, ground_image and track

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-11 18:00:00.000000

Moves the media metadata into one table `media` (files now live in the media folder of the backend):
`source` `/assets/<rest>` becomes `storage_key` `<rest>`, entries with the same file are merged.
`scene.wall_image_id`, `scene.ground_image_id` and `scene_track.media_id` (formerly `track_id`) point to `media.id`.
"""

import mimetypes
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LEGACY_SOURCE_PREFIX = "/assets/"
DEFAULT_CONTENT_TYPE = "application/octet-stream"


def _storage_key(source: str) -> str:
    if source.startswith(LEGACY_SOURCE_PREFIX):
        return source[len(LEGACY_SOURCE_PREFIX) :]
    return source.lstrip("/")


def _content_type(storage_key: str) -> str:
    content_type, _encoding = mimetypes.guess_type(storage_key)
    return content_type or DEFAULT_CONTENT_TYPE


def upgrade() -> None:
    conn = op.get_bind()

    media = op.create_table(
        "media",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("storage_key", sa.String(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=True),
        sa.CheckConstraint("kind IN ('image', 'audio')", name=op.f("ck_media_kind")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media")),
        sa.UniqueConstraint("storage_key", name=op.f("uq_media_storage_key")),
    )

    # Old table -> {old id: media id}; the same file (storage_key) becomes one media entry.
    media_ids: dict[str, int] = {}
    id_maps: dict[str, dict[int, int]] = {}
    for table, kind in (("wall_image", "image"), ("ground_image", "image"), ("track", "audio")):
        id_maps[table] = {}
        for old_id, name, source in conn.execute(sa.text(f"SELECT id, name, source FROM {table} ORDER BY id")):
            key = _storage_key(source)
            if key not in media_ids:
                media_ids[key] = conn.execute(
                    sa.insert(media)
                    .values(kind=kind, name=name, storage_key=key, content_type=_content_type(key), size=None)
                    .returning(media.c.id)
                ).scalar_one()
            id_maps[table][old_id] = media_ids[key]

    op.drop_constraint(op.f("fk_scene_wall_image_id_wall_image"), "scene", type_="foreignkey")
    op.drop_constraint(op.f("fk_scene_ground_image_id_ground_image"), "scene", type_="foreignkey")
    # Dropped while remapping so that intermediate states cannot collide; recreated below.
    op.drop_constraint(op.f("uq_scene_ground_image_id"), "scene", type_="unique")
    scenes = conn.execute(sa.text("SELECT id, wall_image_id, ground_image_id FROM scene")).all()
    for scene_id, wall_image_id, ground_image_id in scenes:
        conn.execute(
            sa.text("UPDATE scene SET wall_image_id = :wall, ground_image_id = :ground WHERE id = :id"),
            {
                "wall": id_maps["wall_image"][wall_image_id],
                "ground": id_maps["ground_image"][ground_image_id],
                "id": scene_id,
            },
        )
    op.create_unique_constraint(op.f("uq_scene_ground_image_id"), "scene", ["ground_image_id"])
    op.create_foreign_key(op.f("fk_scene_wall_image_id_media"), "scene", "media", ["wall_image_id"], ["id"])
    op.create_foreign_key(op.f("fk_scene_ground_image_id_media"), "scene", "media", ["ground_image_id"], ["id"])

    op.add_column("scene_track", sa.Column("media_id", sa.Integer(), nullable=True))
    for track_id, media_id in id_maps["track"].items():
        conn.execute(
            sa.text("UPDATE scene_track SET media_id = :media_id WHERE track_id = :track_id"),
            {"media_id": media_id, "track_id": track_id},
        )
    op.drop_constraint(op.f("pk_scene_track"), "scene_track", type_="primary")
    op.drop_constraint(op.f("fk_scene_track_track_id_track"), "scene_track", type_="foreignkey")
    op.drop_column("scene_track", "track_id")
    op.alter_column("scene_track", "media_id", nullable=False)
    op.create_primary_key(op.f("pk_scene_track"), "scene_track", ["scene_id", "media_id"])
    op.create_foreign_key(op.f("fk_scene_track_media_id_media"), "scene_track", "media", ["media_id"], ["id"])

    op.drop_table("wall_image")
    op.drop_table("ground_image")
    op.drop_table("track")


def downgrade() -> None:
    conn = op.get_bind()

    tables = {
        name: op.create_table(
            name,
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("source", sa.String(), nullable=False),
            sa.PrimaryKeyConstraint("id", name=op.f(f"pk_{name}")),
        )
        for name in ("ground_image", "track", "wall_image")
    }

    media_rows = {
        media_id: (kind, name, storage_key)
        for media_id, kind, name, storage_key in conn.execute(
            sa.text("SELECT id, kind, name, storage_key FROM media ORDER BY id")
        )
    }
    scenes = conn.execute(sa.text("SELECT id, wall_image_id, ground_image_id FROM scene ORDER BY id")).all()
    scene_tracks = conn.execute(sa.text("SELECT DISTINCT media_id FROM scene_track")).scalars().all()

    # Wall images, ground images and tracks get their own rows again (a file used for wall and ground becomes two).
    # Unused media are kept: images as wall images, audio as tracks.
    used_as: dict[str, set[int]] = {
        "wall_image": {wall for _scene, wall, _ground in scenes},
        "ground_image": {ground for _scene, _wall, ground in scenes},
        "track": set(scene_tracks),
    }
    used = set().union(*used_as.values())
    for media_id, (kind, _name, _key) in media_rows.items():
        if media_id not in used:
            used_as["wall_image" if kind == "image" else "track"].add(media_id)

    id_maps: dict[str, dict[int, int]] = {}
    for name, media_ids in used_as.items():
        id_maps[name] = {}
        for media_id in sorted(media_ids):
            _kind, media_name, key = media_rows[media_id]
            id_maps[name][media_id] = conn.execute(
                sa.insert(tables[name])
                .values(name=media_name, source=f"{LEGACY_SOURCE_PREFIX}{key}")
                .returning(tables[name].c.id)
            ).scalar_one()

    op.drop_constraint(op.f("fk_scene_wall_image_id_media"), "scene", type_="foreignkey")
    op.drop_constraint(op.f("fk_scene_ground_image_id_media"), "scene", type_="foreignkey")
    op.drop_constraint(op.f("uq_scene_ground_image_id"), "scene", type_="unique")
    for scene_id, wall_image_id, ground_image_id in scenes:
        conn.execute(
            sa.text("UPDATE scene SET wall_image_id = :wall, ground_image_id = :ground WHERE id = :id"),
            {
                "wall": id_maps["wall_image"][wall_image_id],
                "ground": id_maps["ground_image"][ground_image_id],
                "id": scene_id,
            },
        )
    op.create_unique_constraint(op.f("uq_scene_ground_image_id"), "scene", ["ground_image_id"])
    op.create_foreign_key(op.f("fk_scene_wall_image_id_wall_image"), "scene", "wall_image", ["wall_image_id"], ["id"])
    op.create_foreign_key(
        op.f("fk_scene_ground_image_id_ground_image"), "scene", "ground_image", ["ground_image_id"], ["id"]
    )

    op.add_column("scene_track", sa.Column("track_id", sa.Integer(), nullable=True))
    for media_id, track_id in id_maps["track"].items():
        conn.execute(
            sa.text("UPDATE scene_track SET track_id = :track_id WHERE media_id = :media_id"),
            {"track_id": track_id, "media_id": media_id},
        )
    op.drop_constraint(op.f("pk_scene_track"), "scene_track", type_="primary")
    op.drop_constraint(op.f("fk_scene_track_media_id_media"), "scene_track", type_="foreignkey")
    op.drop_column("scene_track", "media_id")
    op.alter_column("scene_track", "track_id", nullable=False)
    op.create_primary_key(op.f("pk_scene_track"), "scene_track", ["scene_id", "track_id"])
    op.create_foreign_key(op.f("fk_scene_track_track_id_track"), "scene_track", "track", ["track_id"], ["id"])

    op.drop_table("media")
