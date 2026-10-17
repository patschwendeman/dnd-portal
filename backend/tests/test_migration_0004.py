"""Migration 0003 -> 0004 (game table) with and without adventures, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0004"

# The smallest ID is not the first row inserted.
ADVENTURES_0003 = """
INSERT INTO adventure (id, name, description, global_level, active_scene_id) VALUES
    (7, 'Later', NULL, 1, NULL),
    (3, 'Smallest', NULL, 1, NULL);
"""

GAME_TABLE_ROWS = "SELECT id, active_adventure_id, theme FROM game_table"


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


def test_upgrade_activates_the_adventure_with_the_smallest_id(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0003")
    run(ADVENTURES_0003)

    command.upgrade(alembic_config, "0004")

    assert run(GAME_TABLE_ROWS) == [(1, 3, "dark")]


def test_upgrade_of_empty_database_creates_the_row_without_adventure(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0004")

    assert run(GAME_TABLE_ROWS) == [(1, None, "dark")]


@pytest.mark.parametrize(
    "statement",
    [
        "INSERT INTO game_table (id, theme) VALUES (2, 'dark')",
        "UPDATE game_table SET theme = 'light'",
        "UPDATE game_table SET active_adventure_id = 999",
    ],
)
def test_constraints_keep_a_single_valid_row(alembic_config: Config, statement: str) -> None:
    command.upgrade(alembic_config, "0004")

    with pytest.raises(IntegrityError):
        run(statement)
    assert run(GAME_TABLE_ROWS) == [(1, None, "dark")]


def test_deleting_the_active_adventure_clears_it(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0003")
    run(ADVENTURES_0003)
    command.upgrade(alembic_config, "0004")

    run("DELETE FROM adventure WHERE id = 3")

    assert run(GAME_TABLE_ROWS) == [(1, None, "dark")]


def test_downgrade_removes_the_game_table_and_keeps_the_adventures(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0003")
    run(ADVENTURES_0003)
    command.upgrade(alembic_config, "0004")
    run("UPDATE game_table SET theme = 'tavern', active_adventure_id = 7")

    command.downgrade(alembic_config, "0003")

    assert "game_table" not in table_names()
    assert run("SELECT id, name FROM adventure ORDER BY id") == [(3, "Smallest"), (7, "Later")]
