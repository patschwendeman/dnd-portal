"""Migration 0007 -> 0008 (cell size of the Ground grid on the game table) with an existing game table, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0008"

GAME_TABLE_ROWS = "SELECT id, active_adventure_id, theme FROM game_table ORDER BY id"


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


def game_table_columns() -> set[str]:
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return {column["name"] for column in inspect(connection).get_columns("game_table")}
    finally:
        engine.dispose()


def test_upgrade_sets_cell_size_100_and_keeps_the_game_table(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0007")
    run("UPDATE game_table SET theme = 'tavern'")
    rows_before = run(GAME_TABLE_ROWS)

    command.upgrade(alembic_config, "0008")

    assert run(GAME_TABLE_ROWS) == rows_before
    assert run("SELECT ground_grid_cell_size FROM game_table") == [(100,)]


@pytest.mark.parametrize("cell_size", [100, 150, 200])
def test_cell_size_accepts_steps_of_ten(alembic_config: Config, cell_size: int) -> None:
    command.upgrade(alembic_config, "0008")

    run(f"UPDATE game_table SET ground_grid_cell_size = {cell_size}")

    assert run("SELECT ground_grid_cell_size FROM game_table") == [(cell_size,)]


@pytest.mark.parametrize("cell_size", ["90", "155", "210", "NULL"])
def test_cell_size_rejects_invalid_values(alembic_config: Config, cell_size: str) -> None:
    command.upgrade(alembic_config, "0008")

    with pytest.raises(IntegrityError):
        run(f"UPDATE game_table SET ground_grid_cell_size = {cell_size}")


def test_downgrade_drops_the_column_and_keeps_the_game_table(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0008")
    run("UPDATE game_table SET theme = 'tavern', ground_grid_cell_size = 150")
    rows_before = run(GAME_TABLE_ROWS)

    command.downgrade(alembic_config, "0007")

    assert "ground_grid_cell_size" not in game_table_columns()
    assert run(GAME_TABLE_ROWS) == rows_before
