"""Schema migrations with Alembic, run on app start (lifespan) before the seeder."""

from collections.abc import Iterable
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, inspect

from app.db.session import engine

ALEMBIC_INI_PATH = Path(__file__).resolve().parents[2] / "alembic.ini"
ALEMBIC_VERSION_TABLE = "alembic_version"
RESET_HINT = (
    "docker compose -f compose.dev.yaml down -v (dev) or docker compose -f compose.prod.yaml down -v (prod), "
    "run in the repository root"
)


def check_legacy_schema(table_names: Iterable[str]) -> None:
    """Refuse a database created before Alembic (tables, but no alembic_version): it has to be reset once."""
    names = set(table_names)
    if names and ALEMBIC_VERSION_TABLE not in names:
        raise RuntimeError(
            "The database contains tables but no Alembic version history (schema from before the migrations). "
            f"Reset the database once and restart: {RESET_HINT}."
        )


def run_migrations(bind: Engine = engine) -> None:
    check_legacy_schema(inspect(bind).get_table_names())

    config = Config(str(ALEMBIC_INI_PATH))
    # Keep the logging configuration of the app (uvicorn) instead of applying the one from alembic.ini.
    config.attributes["configure_logger"] = False
    command.upgrade(config, "head")
