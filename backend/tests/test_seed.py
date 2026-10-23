"""Seeder: adventures, players, media entries with content type and size from the media folder (missing files only log
a warning) and scenes.

The seeding test runs in a transaction on the shared test DB that is rolled back afterwards.
"""

import logging
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.seed import build_media, seed_data
from app.models import Adventure, Media, Player, Scene

WALL_KEY = "seed-test/wall.jpg"
GROUND_KEY = "seed-test/ground.png"
TRACK_KEY = "seed-test/track.mp3"
MISSING_KEY = "seed-test/missing.mp3"


@pytest.fixture
def seed_media_dir(tmp_path: Path) -> Path:
    for key, content in ((WALL_KEY, b"wall"), (GROUND_KEY, b"ground!"), (TRACK_KEY, b"0123456789")):
        path = tmp_path / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    return tmp_path


@pytest.fixture
def db(client: TestClient) -> Iterator[Session]:
    """Session in an outer transaction (commits of the seeder become savepoints) with empty seed tables.

    TRUNCATE ... RESTART IDENTITY is transactional in PostgreSQL: the rollback restores data and sequences.
    """
    from app.db.session import engine

    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        session.execute(text("TRUNCATE game_table, player, adventure, scene_track, scene, media RESTART IDENTITY"))
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()


def test_build_media_reads_size_and_content_type(seed_media_dir: Path) -> None:
    media = build_media({"kind": "image", "name": "Wall", "storage_key": GROUND_KEY}, seed_media_dir)

    assert (media.kind, media.name, media.storage_key) == ("image", "Wall", GROUND_KEY)
    assert media.content_type == "image/png"
    assert media.size == len(b"ground!")
    assert media.source == f"/media/{GROUND_KEY}"


def test_build_media_for_missing_file_warns_and_keeps_entry(
    seed_media_dir: Path, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.WARNING, logger="app.db.seed"):
        media = build_media({"kind": "audio", "name": "Gone", "storage_key": MISSING_KEY}, seed_media_dir)

    assert media.size is None
    assert media.content_type == "audio/mpeg"
    assert [record.levelno for record in caplog.records] == [logging.WARNING]
    assert MISSING_KEY in caplog.text


def test_seed_data_creates_adventure_media_scenes_and_players_with_references(
    db: Session, seed_media_dir: Path, caplog: pytest.LogCaptureFixture
) -> None:
    data: dict[str, Any] = {
        "adventures": [{"name": "Adventure", "description": "Test", "global_level": 3}],
        "media": [
            {"kind": "image", "name": "Wall", "storage_key": WALL_KEY},
            {"kind": "image", "name": "Ground", "storage_key": GROUND_KEY},
            {"kind": "audio", "name": "Track", "storage_key": TRACK_KEY},
            {"kind": "audio", "name": "Missing", "storage_key": MISSING_KEY},
        ],
        "scenes": [
            {
                "adventure_id": 1,
                "name": "Scene",
                "description": "Test",
                "wall_image_id": 1,
                "ground_image_id": 2,
                "track_ids": [3, 4],
            }
        ],
        "players": [
            {
                "adventure_id": 1,
                "player_name": "Player",
                "character_name": "Hero",
                "race": "Elf",
                "character_class": "Bard",
                "avatar_media_id": 2,
            },
            {
                "adventure_id": 1,
                "player_name": "Other",
                "character_name": "Sidekick",
                "race": "Zwerg",
                "character_class": "Kleriker",
                "avatar_media_id": None,
            },
        ],
    }
    with caplog.at_level(logging.WARNING, logger="app.db.seed"):
        seed_data(db, data, seed_media_dir)

    media = {item.storage_key: item for item in db.scalars(select(Media))}
    assert {key: (item.kind, item.content_type, item.size) for key, item in media.items()} == {
        WALL_KEY: ("image", "image/jpeg", 4),
        GROUND_KEY: ("image", "image/png", 7),
        TRACK_KEY: ("audio", "audio/mpeg", 10),
        MISSING_KEY: ("audio", "audio/mpeg", None),
    }
    scene = db.scalars(select(Scene)).one()
    assert scene.wall_image.storage_key == WALL_KEY
    assert scene.ground_image.storage_key == GROUND_KEY
    assert sorted(track.storage_key for track in scene.tracks) == [MISSING_KEY, TRACK_KEY]
    assert MISSING_KEY in caplog.text
    adventure = db.scalars(select(Adventure)).one()
    assert (adventure.name, adventure.description, adventure.global_level) == ("Adventure", "Test", 3)
    assert adventure.active_scene_id is None
    assert [s.id for s in adventure.scenes] == [scene.id]
    assert [
        (p.player_name, p.character_name, p.race, p.character_class, p.avatar.storage_key if p.avatar else None)
        for p in db.scalars(select(Player).order_by(Player.id))
    ] == [("Player", "Hero", "Elf", "Bard", GROUND_KEY), ("Other", "Sidekick", "Zwerg", "Kleriker", None)]


def seed_with(adventure: str, media_key: str, player: str) -> dict[str, Any]:
    return {
        "adventures": [{"name": adventure, "description": None, "global_level": 1}],
        "media": [{"kind": "image", "name": "Wall", "storage_key": media_key}],
        "scenes": [],
        "players": [
            {
                "adventure_id": 1,
                "player_name": player,
                "character_name": "Hero",
                "race": "Mensch",
                "character_class": "Magier",
                "avatar_media_id": None,
            }
        ],
    }


def test_seed_data_does_not_touch_filled_tables(db: Session, seed_media_dir: Path) -> None:
    seed_data(db, seed_with("First", WALL_KEY, "Player"), seed_media_dir)

    seed_data(db, seed_with("Second", GROUND_KEY, "Other"), seed_media_dir)

    assert [item.storage_key for item in db.scalars(select(Media))] == [WALL_KEY]
    assert [item.name for item in db.scalars(select(Adventure))] == ["First"]
    assert [item.player_name for item in db.scalars(select(Player))] == ["Player"]
