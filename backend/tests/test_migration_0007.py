"""Migration 0006 -> 0007 (tables fight and combatant) with existing data, constraints and cascades, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0007"

DATA_0006 = """
INSERT INTO media (id, kind, name, storage_key, content_type, size) VALUES
    (1, 'image', 'Wall', 'images/wall_screen/forest.jpg', 'image/jpeg', NULL),
    (2, 'image', 'Ground 1', 'images/ground_screen/main_1.jpg', 'image/jpeg', NULL),
    (3, 'image', 'Ground 2', 'images/ground_screen/main_2.jpg', 'image/jpeg', NULL);
INSERT INTO adventure (id, name, description, global_level, active_scene_id) VALUES
    (1, 'Erstes Abenteuer', NULL, 1, NULL),
    (2, 'Zweites Abenteuer', NULL, 1, NULL);
INSERT INTO scene (id, adventure_id, name, description, wall_image_id, ground_image_id) VALUES
    (1, 1, 'Village', 'A silent little Village', 1, 2),
    (2, 1, 'Chamber', 'A spooky Chamber', 1, 3);
INSERT INTO player (id, adventure_id, player_name, character_name, race, character_class) VALUES
    (1, 1, 'Lena', 'Thalia', 'Elfe', 'Magierin'),
    (2, 1, 'Jonas', 'Brom', 'Zwerg', 'Kämpfer');
UPDATE adventure SET active_scene_id = 2 WHERE id = 1;
UPDATE game_table SET active_adventure_id = 1;
"""

FIGHT = """
INSERT INTO fight (id, adventure_id, scene_id) VALUES (1, 1, 2);
INSERT INTO combatant (id, fight_id, position, kind, player_id, number, label) VALUES
    (1, 1, 0, 'player', 1, NULL, NULL),
    (2, 1, 1, 'enemy', NULL, 1, 'Ghul'),
    (3, 1, 2, 'ally', NULL, 2, NULL);
UPDATE fight SET active_combatant_id = 2;
"""

OTHER_ROWS = {
    "adventure": "SELECT id, name, active_scene_id FROM adventure ORDER BY id",
    "scene": "SELECT id, adventure_id, name FROM scene ORDER BY id",
    "player": "SELECT id, adventure_id, character_name FROM player ORDER BY id",
    "game_table": "SELECT id, active_adventure_id, theme FROM game_table",
}
FIGHT_ROWS = "SELECT id, adventure_id, scene_id, round, active_combatant_id FROM fight ORDER BY id"
COMBATANT_IDS = "SELECT id FROM combatant ORDER BY id"


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


def other_rows() -> dict[str, list[Any]]:
    return {table: run(sql) for table, sql in OTHER_ROWS.items()}


@pytest.fixture
def migrated(alembic_config: Config) -> Config:
    """Database at 0006 with data, then upgraded to 0007, with a fight of adventure 1."""
    command.upgrade(alembic_config, "0006")
    run(DATA_0006)
    command.upgrade(alembic_config, "0007")
    run(FIGHT)
    return alembic_config


def test_upgrade_keeps_existing_data_and_creates_no_fight(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0006")
    run(DATA_0006)
    before = other_rows()

    command.upgrade(alembic_config, "0007")

    assert {"fight", "combatant"} <= table_names()
    assert other_rows() == before
    assert run(FIGHT_ROWS) == []


@pytest.mark.usefixtures("migrated")
def test_fight_defaults_to_round_one() -> None:
    assert run(FIGHT_ROWS) == [(1, 1, 2, 1, 2)]
    assert run("SELECT defeated FROM combatant ORDER BY id") == [(False,), (False,), (False,)]


@pytest.mark.parametrize(
    "sql",
    [
        "INSERT INTO fight (adventure_id, scene_id) VALUES (1, 1)",
        "UPDATE fight SET round = 0",
        "INSERT INTO combatant (fight_id, position, kind, player_id) VALUES (1, 3, 'player', 1)",
        "INSERT INTO combatant (fight_id, position, kind, number) VALUES (1, 3, 'ally', 1)",
        "INSERT INTO combatant (fight_id, position, kind, number) VALUES (1, 0, 'enemy', 5)",
        "INSERT INTO combatant (fight_id, position, kind, number) VALUES (1, 3, 'monster', 5)",
        "INSERT INTO combatant (fight_id, position, kind, number) VALUES (1, 3, 'enemy', 100)",
        "INSERT INTO combatant (fight_id, position, kind, number) VALUES (1, 3, 'enemy', NULL)",
        "INSERT INTO combatant (fight_id, position, kind, player_id, number) VALUES (1, 3, 'player', 2, 5)",
        "INSERT INTO combatant (fight_id, position, kind, player_id, label) VALUES (1, 3, 'player', 2, 'x')",
        "INSERT INTO combatant (fight_id, position, kind, player_id, number) VALUES (1, 3, 'enemy', 2, 5)",
        "UPDATE fight SET active_combatant_id = 99",
    ],
)
@pytest.mark.usefixtures("migrated")
def test_constraints_reject_invalid_rows(sql: str) -> None:
    with pytest.raises(IntegrityError):
        run(sql)


@pytest.mark.usefixtures("migrated")
def test_positions_may_be_swapped_within_a_transaction() -> None:
    run("UPDATE combatant SET position = 1 WHERE id = 1; UPDATE combatant SET position = 0 WHERE id = 2")

    assert run("SELECT id FROM combatant ORDER BY position") == [(2,), (1,), (3,)]


@pytest.mark.usefixtures("migrated")
def test_deleting_the_active_combatant_clears_the_turn() -> None:
    run("DELETE FROM combatant WHERE id = 2")

    assert run("SELECT active_combatant_id FROM fight") == [(None,)]


@pytest.mark.usefixtures("migrated")
def test_deleting_a_player_deletes_the_combatant() -> None:
    run("DELETE FROM player WHERE id = 1")

    assert run(COMBATANT_IDS) == [(2,), (3,)]


@pytest.mark.usefixtures("migrated")
def test_deleting_the_scene_deletes_the_fight() -> None:
    run("UPDATE adventure SET active_scene_id = NULL; DELETE FROM scene WHERE id = 2")

    assert run(FIGHT_ROWS) == []
    assert run(COMBATANT_IDS) == []


@pytest.mark.usefixtures("migrated")
def test_deleting_the_adventure_deletes_the_fight() -> None:
    # The fight of adventure 2 lies in a scene of adventure 1, so only the adventure itself is deleted.
    run("DELETE FROM combatant; DELETE FROM fight")
    run("INSERT INTO fight (id, adventure_id, scene_id) VALUES (2, 2, 1)")
    run("INSERT INTO combatant (fight_id, position, kind, number) VALUES (2, 0, 'enemy', 1)")

    run("DELETE FROM adventure WHERE id = 2")

    assert run(FIGHT_ROWS) == []
    assert run(COMBATANT_IDS) == []


def test_downgrade_drops_both_tables_and_keeps_the_rest(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0006")
    run(DATA_0006)
    before = other_rows()
    command.upgrade(alembic_config, "0007")
    run(FIGHT)

    command.downgrade(alembic_config, "0006")

    assert not {"fight", "combatant"} & table_names()
    assert other_rows() == before
