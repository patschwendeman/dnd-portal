"""Migration 0001 -> 0002 (media table) with data, and back.

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

TEST_DATABASE = f"{settings.postgres_db}_migration_0002"

LEGACY_DATA = """
INSERT INTO wall_image (id, name, source) VALUES
    (1, 'Forest', '/assets/images/wall_screen/forest.jpg'),
    (2, 'Level_up', '/assets/images/wall_screen/levelUp.jpg');
INSERT INTO ground_image (id, name, source) VALUES
    (1, 'main_1', '/assets/images/ground_screen/main_1.jpg'),
    (2, 'Level_up', '/assets/images/wall_screen/levelUp.jpg');
INSERT INTO track (id, name, source) VALUES
    (1, 'Forest', '/assets/music/side/forest/City_Gates.mp3'),
    (2, 'Boss', '/assets/music/main/boss/Track_44.mp3'),
    (3, 'Unused', '/assets/music/main/loot/Secunda.mp3');
INSERT INTO scene (id, name, description, main, wall_image_id, ground_image_id) VALUES
    (1, 'Fight', 'A spooky Chamber', true, 1, 1),
    (2, 'Level Up', 'Level Up Screen', false, 2, 2);
INSERT INTO scene_track (scene_id, track_id) VALUES (1, 1), (1, 2), (2, 2);
"""

# Scene -> (wall image, ground image, tracks) as file paths relative to the media folder.
EXPECTED_SCENE_MEDIA = {
    1: (
        "images/wall_screen/forest.jpg",
        "images/ground_screen/main_1.jpg",
        ["music/main/boss/Track_44.mp3", "music/side/forest/City_Gates.mp3"],
    ),
    2: ("images/wall_screen/levelUp.jpg", "images/wall_screen/levelUp.jpg", ["music/main/boss/Track_44.mp3"]),
}


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
            return list(result) if result.returns_rows else []
    finally:
        engine.dispose()


def table_names() -> set[str]:
    engine = create_engine(settings.database_url)
    try:
        with engine.connect() as connection:
            return set(inspect(connection).get_table_names())
    finally:
        engine.dispose()


def scene_media_after_upgrade() -> dict[int, tuple[str, str, list[str]]]:
    rows = run(
        """
        SELECT s.id, w.storage_key, g.storage_key,
               ARRAY(SELECT m.storage_key FROM scene_track st JOIN media m ON m.id = st.media_id
                     WHERE st.scene_id = s.id ORDER BY m.storage_key)
        FROM scene s JOIN media w ON w.id = s.wall_image_id JOIN media g ON g.id = s.ground_image_id
        """
    )
    return {scene_id: (wall, ground, list(tracks)) for scene_id, wall, ground, tracks in rows}


def scene_media_after_downgrade() -> dict[int, tuple[str, str, list[str]]]:
    rows = run(
        """
        SELECT s.id, w.source, g.source,
               ARRAY(SELECT t.source FROM scene_track st JOIN track t ON t.id = st.track_id
                     WHERE st.scene_id = s.id ORDER BY t.source)
        FROM scene s JOIN wall_image w ON w.id = s.wall_image_id JOIN ground_image g ON g.id = s.ground_image_id
        """
    )
    return {scene_id: (wall, ground, list(tracks)) for scene_id, wall, ground, tracks in rows}


def test_upgrade_moves_media_into_one_table_and_keeps_the_scene_assignment(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0001")
    run(LEGACY_DATA)

    command.upgrade(alembic_config, "0002")

    assert {"wall_image", "ground_image", "track"}.isdisjoint(table_names())
    assert scene_media_after_upgrade() == EXPECTED_SCENE_MEDIA
    media = run("SELECT kind, name, storage_key, content_type, size FROM media ORDER BY id")
    assert [tuple(row) for row in media] == [
        ("image", "Forest", "images/wall_screen/forest.jpg", "image/jpeg", None),
        ("image", "Level_up", "images/wall_screen/levelUp.jpg", "image/jpeg", None),
        ("image", "main_1", "images/ground_screen/main_1.jpg", "image/jpeg", None),
        ("audio", "Forest", "music/side/forest/City_Gates.mp3", "audio/mpeg", None),
        ("audio", "Boss", "music/main/boss/Track_44.mp3", "audio/mpeg", None),
        ("audio", "Unused", "music/main/loot/Secunda.mp3", "audio/mpeg", None),
    ]


def test_downgrade_restores_the_legacy_tables_with_the_same_assignment(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "0001")
    run(LEGACY_DATA)
    command.upgrade(alembic_config, "0002")

    command.downgrade(alembic_config, "0001")

    assert "media" not in table_names()
    assert scene_media_after_downgrade() == {
        scene_id: (f"/assets/{wall}", f"/assets/{ground}", [f"/assets/{track}" for track in tracks])
        for scene_id, (wall, ground, tracks) in EXPECTED_SCENE_MEDIA.items()
    }
    # Unused tracks survive the round trip.
    assert ("/assets/music/main/loot/Secunda.mp3",) in [tuple(row) for row in run("SELECT source FROM track")]
