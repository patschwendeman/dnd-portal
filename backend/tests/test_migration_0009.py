"""Migration 0008 -> 0009 (one adventure image, theme `dark` renamed to `cyber`) with existing data, and back.

Runs in an own, temporary database so that the shared test DB stays untouched (needs CREATE DATABASE, which the
POSTGRES_USER of the postgres image has).
"""

from collections.abc import Iterator
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.db.migrate import ALEMBIC_INI_PATH

TEST_DATABASE = f"{settings.postgres_db}_migration_0009"

MEDIA_0008 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (3, 'image', 'Forest', 'images/wall_screen/forest.jpg', 'image/jpeg', NULL),
    (7, 'image', 'Fight', 'images/wall_screen/fight.jpg', 'image/jpeg', NULL),
    (9, 'image', 'Tavern', 'images/wall_screen/tavern.jpg', 'image/jpeg', NULL);
"""

# The forest image is missing.
MEDIA_WITHOUT_FOREST_0008 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (7, 'image', 'Fight', 'images/wall_screen/fight.jpg', 'image/jpeg', NULL),
    (9, 'image', 'Tavern', 'images/wall_screen/tavern.jpg', 'image/jpeg', NULL);
"""

ADVENTURES_0008 = """
INSERT INTO adventure (id, name, description, global_level, active_scene_id, background_dark_media_id,
                       background_tavern_media_id) VALUES
    (1, 'Erstes Abenteuer', NULL, 3, NULL, 7, 9),
    (2, 'Zweites Abenteuer', 'Test', 1, NULL, NULL, NULL);
"""

ADVENTURE_ROWS = "SELECT id, name, description, global_level FROM adventure ORDER BY id"
IMAGE_ROWS = "SELECT id, image_media_id FROM adventure ORDER BY id"
BACKGROUND_ROWS = "SELECT id, background_dark_media_id, background_tavern_media_id FROM adventure ORDER BY id"
BACKGROUND_COLUMNS = {"background_dark_media_id", "background_tavern_media_id"}
THEME = "SELECT theme FROM game_table"


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


def adventure_columns() -> dict[str, dict[str, Any]]:
    """Column name -> column info of the table adventure."""
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return {column["name"]: column for column in inspect(connection).get_columns("adventure")}
    finally:
        engine.dispose()


def migrate_to_0008_with(alembic_config: Config, media: str, theme: str = "dark") -> None:
    command.upgrade(alembic_config, "0008")
    run(media)
    run(ADVENTURES_0008)
    run(f"UPDATE game_table SET theme = '{theme}'")


def test_upgrade_renames_dark_to_cyber_and_sets_the_forest_image(alembic_config: Config) -> None:
    migrate_to_0008_with(alembic_config, MEDIA_0008)
    adventures_before = run(ADVENTURE_ROWS)

    command.upgrade(alembic_config, "0009")

    assert run(THEME) == [("cyber",)]
    columns = adventure_columns()
    assert columns["image_media_id"]["nullable"]
    assert not BACKGROUND_COLUMNS & set(columns)
    assert run(IMAGE_ROWS) == [(1, 3), (2, 3)]
    assert run(ADVENTURE_ROWS) == adventures_before


def test_upgrade_keeps_the_tavern_theme(alembic_config: Config) -> None:
    migrate_to_0008_with(alembic_config, MEDIA_0008, theme="tavern")

    command.upgrade(alembic_config, "0009")

    assert run(THEME) == [("tavern",)]


def test_upgrade_leaves_the_image_empty_without_the_forest_image(alembic_config: Config) -> None:
    migrate_to_0008_with(alembic_config, MEDIA_WITHOUT_FOREST_0008)

    command.upgrade(alembic_config, "0009")

    assert run(IMAGE_ROWS) == [(1, None), (2, None)]


def test_theme_dark_is_rejected_and_cyber_is_the_default(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0009")

    with pytest.raises(IntegrityError, match="ck_game_table_theme"):
        run("UPDATE game_table SET theme = 'dark'")
    run("DELETE FROM game_table")
    run("INSERT INTO game_table (id) VALUES (1)")
    assert run(THEME) == [("cyber",)]


def test_image_must_reference_media(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0009")
    run("INSERT INTO adventure (id, name, global_level) VALUES (1, 'Erstes Abenteuer', 1)")

    with pytest.raises(IntegrityError, match="foreign key"):
        run("UPDATE adventure SET image_media_id = 999")


def test_downgrade_restores_dark_and_the_backgrounds(alembic_config: Config) -> None:
    migrate_to_0008_with(alembic_config, MEDIA_0008)
    adventures_before = run(ADVENTURE_ROWS)
    command.upgrade(alembic_config, "0009")

    command.downgrade(alembic_config, "0008")

    assert run(THEME) == [("dark",)]
    assert "image_media_id" not in adventure_columns()
    assert run(BACKGROUND_ROWS) == [(1, 7, 9), (2, 7, 9)]
    assert run(ADVENTURE_ROWS) == adventures_before
    assert run("SELECT count(*) FROM media") == [(3,)]
    with pytest.raises(IntegrityError, match="ck_game_table_theme"):
        run("UPDATE game_table SET theme = 'cyber'")
