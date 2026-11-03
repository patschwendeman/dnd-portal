"""Migration 0005 -> 0006 (background image per theme on the adventure) with existing adventures, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0006"

ADVENTURES_0005 = """
INSERT INTO adventure (id, name, description, global_level, active_scene_id) VALUES
    (1, 'Erstes Abenteuer', NULL, 3, NULL),
    (2, 'Zweites Abenteuer', 'Test', 1, NULL);
"""

MEDIA_0005 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (1, 'image', 'Forest', 'images/wall_screen/forest.jpg', 'image/jpeg', NULL),
    (7, 'image', 'Fight', 'images/wall_screen/fight.jpg', 'image/jpeg', NULL),
    (9, 'image', 'Tavern', 'images/wall_screen/tavern.jpg', 'image/jpeg', NULL);
"""

# Only the dark default image exists.
MEDIA_WITHOUT_TAVERN_0005 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (7, 'image', 'Fight', 'images/wall_screen/fight.jpg', 'image/jpeg', NULL);
"""

ADVENTURE_ROWS = "SELECT id, name, description, global_level FROM adventure ORDER BY id"
BACKGROUND_ROWS = "SELECT id, background_dark_media_id, background_tavern_media_id FROM adventure ORDER BY id"
BACKGROUND_COLUMNS = {"background_dark_media_id", "background_tavern_media_id"}


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


def test_upgrade_sets_default_backgrounds_for_existing_adventures(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0005")
    run(MEDIA_0005)
    run(ADVENTURES_0005)
    adventures_before = run(ADVENTURE_ROWS)

    command.upgrade(alembic_config, "0006")

    columns = adventure_columns()
    assert all(columns[name]["nullable"] for name in BACKGROUND_COLUMNS)
    assert run(BACKGROUND_ROWS) == [(1, 7, 9), (2, 7, 9)]
    assert run(ADVENTURE_ROWS) == adventures_before


def test_upgrade_leaves_background_empty_without_the_image(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0005")
    run(MEDIA_WITHOUT_TAVERN_0005)
    run(ADVENTURES_0005)

    command.upgrade(alembic_config, "0006")

    assert run(BACKGROUND_ROWS) == [(1, 7, None), (2, 7, None)]


def test_upgrade_of_empty_database_creates_the_columns(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0006")

    assert set(adventure_columns()) >= BACKGROUND_COLUMNS


def test_background_must_reference_media(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0006")
    run(ADVENTURES_0005)

    with pytest.raises(IntegrityError, match="foreign key"):
        run("UPDATE adventure SET background_dark_media_id = 999")


def test_downgrade_drops_the_columns_and_keeps_adventures_and_media(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0005")
    run(MEDIA_0005)
    run(ADVENTURES_0005)
    adventures_before = run(ADVENTURE_ROWS)
    command.upgrade(alembic_config, "0006")

    command.downgrade(alembic_config, "0005")

    assert not BACKGROUND_COLUMNS & set(adventure_columns())
    assert run(ADVENTURE_ROWS) == adventures_before
    assert run("SELECT count(*) FROM media") == [(3,)]
