"""Legacy-database check before the migrations: works on a list of table names, the shared test DB stays untouched."""

import pytest

from app.db.migrate import check_legacy_schema

LEGACY_TABLES = ["graphics_wall", "graphics_ground", "music", "scene", "scene_music_association"]


def test_tables_without_alembic_version_raise_with_reset_hint() -> None:
    with pytest.raises(RuntimeError) as error:
        check_legacy_schema(LEGACY_TABLES)

    message = str(error.value)
    assert "no Alembic version history" in message
    assert "docker compose -f compose.dev.yaml down -v" in message
    assert "docker compose -f compose.prod.yaml down -v" in message


def test_empty_database_passes() -> None:
    check_legacy_schema([])


@pytest.mark.parametrize(
    "tables",
    [
        ["alembic_version"],
        ["alembic_version", "wall_image", "ground_image", "track", "scene", "scene_track"],
    ],
)
def test_database_with_alembic_version_passes(tables: list[str]) -> None:
    check_legacy_schema(tables)
