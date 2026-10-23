"""Migration 0004 -> 0005 (scene without main) with scenes and an active scene, and back.

Runs in an own, temporary database so that the shared test DB stays untouched (needs CREATE DATABASE, which the
POSTGRES_USER of the postgres image has).
"""

from collections.abc import Iterator
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import settings
from app.db.migrate import ALEMBIC_INI_PATH

TEST_DATABASE = f"{settings.postgres_db}_migration_0005"

# A former battle scene (main true) and a former non-battle scene (main false); the battle scene is active.
SCENES_0004 = """
INSERT INTO adventure (id, name, description, global_level, active_scene_id) VALUES
    (1, 'Erstes Abenteuer', NULL, 1, NULL);
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (1, 'image', 'Wall', 'images/wall_screen/forest.jpg', 'image/jpeg', NULL),
    (2, 'image', 'Ground 1', 'images/ground_screen/main_1.jpg', 'image/jpeg', NULL),
    (3, 'image', 'Ground 2', 'images/ground_screen/main_2.jpg', 'image/jpeg', NULL),
    (4, 'audio', 'Track 1', 'music/main/boss/Track_44.mp3', 'audio/mpeg', NULL),
    (5, 'audio', 'Track 2', 'music/main/boss/The_trail.mp3', 'audio/mpeg', NULL);
INSERT INTO scene (id, adventure_id, name, description, main, wall_image_id, ground_image_id) VALUES
    (1, 1, 'Default', 'A silent little Village', false, 1, 2),
    (2, 1, 'Fight', 'A spooky Chamber', true, 1, 3);
INSERT INTO scene_track (scene_id, media_id) VALUES (1, 4), (2, 4), (2, 5);
UPDATE adventure SET active_scene_id = 2 WHERE id = 1;
UPDATE game_table SET active_adventure_id = 1;
"""

SCENE_ROWS = "SELECT id, adventure_id, name, description, wall_image_id, ground_image_id FROM scene ORDER BY id"
TRACK_ROWS = "SELECT scene_id, media_id FROM scene_track ORDER BY scene_id, media_id"
ACTIVE_ROWS = (
    "SELECT game_table.active_adventure_id, adventure.active_scene_id "
    "FROM game_table JOIN adventure ON adventure.id = game_table.active_adventure_id"
)


@pytest.fixture
def alembic_config(monkeypatch: pytest.MonkeyPatch) -> Iterator[Config]:
    admin_engine = create_engine(settings.database_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DATABASE}" WITH (FORCE)'))
        connection.execute(text(f'CREATE DATABASE "{TEST_DATABASE}"'))
    # migrations/env.py builds its URL from the settings instance.
    monkeypatch.setattr(settings, "postgres_db", TEST_DATABASE)
    config = Config(str(ALEMBIC_INI_PATH))
    config.attributes["configure_logger"] = False
    try:
        yield config
    finally:
        monkeypatch.undo()
        with admin_engine.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DATABASE}" WITH (FORCE)'))
        admin_engine.dispose()


def run(sql: str) -> list[Any]:
    engine = create_engine(settings.database_url)
    try:
        with engine.begin() as connection:
            result = connection.execute(text(sql))
            return [tuple(row) for row in result] if result.returns_rows else []
    finally:
        engine.dispose()


def scene_columns() -> dict[str, dict[str, Any]]:
    """Column name -> column info of the table scene."""
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return {column["name"]: column for column in inspect(connection).get_columns("scene")}
    finally:
        engine.dispose()


def test_upgrade_drops_main_and_keeps_scenes_tracks_and_active_scene(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0004")
    run(SCENES_0004)
    scenes_before = run(SCENE_ROWS)
    tracks_before = run(TRACK_ROWS)

    command.upgrade(alembic_config, "0005")

    assert "main" not in scene_columns()
    assert run(SCENE_ROWS) == scenes_before
    assert run(TRACK_ROWS) == tracks_before
    assert run("SELECT count(*) FROM media") == [(5,)]
    assert run(ACTIVE_ROWS) == [(1, 2)]


def test_upgrade_of_empty_database_creates_scene_without_main(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0005")

    assert "main" not in scene_columns()


def test_downgrade_adds_main_as_false_and_keeps_the_scenes(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0004")
    run(SCENES_0004)
    scenes_before = run(SCENE_ROWS)
    tracks_before = run(TRACK_ROWS)
    command.upgrade(alembic_config, "0005")

    command.downgrade(alembic_config, "0004")

    main = scene_columns()["main"]
    assert main["nullable"] is False
    assert main["default"] is None
    # The former split is lost: all scenes become non-battle scenes.
    assert run("SELECT id, main FROM scene ORDER BY id") == [(1, False), (2, False)]
    assert run(SCENE_ROWS) == scenes_before
    assert run(TRACK_ROWS) == tracks_before
    assert run(ACTIVE_ROWS) == [(1, 2)]
