"""Migration 0002 -> 0003 (adventure and player) with and without scenes, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0003"

SCENES_0002 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (1, 'image', 'Wall', 'images/wall_screen/forest.jpg', 'image/jpeg', NULL),
    (2, 'image', 'Ground 1', 'images/ground_screen/main_1.jpg', 'image/jpeg', NULL),
    (3, 'image', 'Ground 2', 'images/ground_screen/main_2.jpg', 'image/jpeg', NULL),
    (4, 'audio', 'Track', 'music/main/boss/Track_44.mp3', 'audio/mpeg', NULL);
INSERT INTO scene (id, name, description, main, wall_image_id, ground_image_id) VALUES
    (1, 'Default', 'A silent little Village', false, 1, 2),
    (2, 'Fight', 'A spooky Chamber', true, 1, 3);
INSERT INTO scene_track (scene_id, media_id) VALUES (1, 4), (2, 4);
"""

SCENE_ROWS = "SELECT id, name, description, main, wall_image_id, ground_image_id FROM scene ORDER BY id"


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


def table_names() -> set[str]:
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return set(inspect(connection).get_table_names())
    finally:
        engine.dispose()


def scene_columns() -> dict[str, bool]:
    """Column name -> nullable of the table scene."""
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return {column["name"]: column["nullable"] for column in inspect(connection).get_columns("scene")}
    finally:
        engine.dispose()


def test_upgrade_assigns_all_scenes_to_the_seed_adventure(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0002")
    run(SCENES_0002)
    scenes_before = run(SCENE_ROWS)

    command.upgrade(alembic_config, "0003")

    assert run("SELECT id, name, description, global_level, active_scene_id FROM adventure") == [
        (1, "Erstes Abenteuer", "Das erste Abenteuer", 1, None)
    ]
    assert run("SELECT id, adventure_id FROM scene ORDER BY id") == [(1, 1), (2, 1)]
    assert scene_columns()["adventure_id"] is False
    assert run(SCENE_ROWS) == scenes_before
    # Players are added by the seeder, not by the migration.
    assert run("SELECT count(*) FROM player") == [(0,)]


def test_upgrade_of_empty_database_creates_no_adventure(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0003")

    assert {"adventure", "player"} <= table_names()
    assert run("SELECT count(*) FROM adventure") == [(0,)]
    assert scene_columns()["adventure_id"] is False


def test_downgrade_removes_adventures_and_keeps_the_scenes(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0002")
    run(SCENES_0002)
    scenes_before = run(SCENE_ROWS)
    command.upgrade(alembic_config, "0003")
    run("UPDATE adventure SET active_scene_id = 2, global_level = 4")

    command.downgrade(alembic_config, "0002")

    assert {"adventure", "player"}.isdisjoint(table_names())
    assert "adventure_id" not in scene_columns()
    assert run(SCENE_ROWS) == scenes_before
    assert run("SELECT scene_id, media_id FROM scene_track ORDER BY scene_id") == [(1, 4), (2, 4)]
