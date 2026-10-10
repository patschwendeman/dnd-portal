"""Settings: read from the environment (DB_*, POSTGRES_*, CORS_ORIGINS) without backend/.env."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings

ENV = {
    "DB_DRIVER": "postgresql+psycopg2",
    "DB_HOST": "db.example",
    "DB_PORT": "6543",
    "POSTGRES_USER": "user",
    "POSTGRES_PASSWORD": "secret",
    "POSTGRES_DB": "portal",
}


@pytest.fixture
def env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    for key in [*ENV, "CORS_ORIGINS"]:
        monkeypatch.delenv(key, raising=False)
    for key, value in ENV.items():
        monkeypatch.setenv(key, value)
    return monkeypatch


def test_settings_read_db_values_and_build_url(env: pytest.MonkeyPatch) -> None:
    settings = Settings(_env_file=None)  # type: ignore[call-arg]

    assert settings.db_driver == "postgresql+psycopg2"
    assert settings.db_host == "db.example"
    assert settings.db_port == 6543
    assert settings.database_url.render_as_string(hide_password=False) == (
        "postgresql+psycopg2://user:secret@db.example:6543/portal"
    )


def test_cors_origins_default_to_local_frontends(env: pytest.MonkeyPatch) -> None:
    settings = Settings(_env_file=None)  # type: ignore[call-arg]

    assert settings.cors_origins == ["http://localhost:5173", "http://localhost:8080"]


def test_cors_origins_are_read_as_json_list(env: pytest.MonkeyPatch) -> None:
    env.setenv("CORS_ORIGINS", '["http://localhost:8080","http://192.168.0.10:8080"]')

    settings = Settings(_env_file=None)  # type: ignore[call-arg]

    assert settings.cors_origins == ["http://localhost:8080", "http://192.168.0.10:8080"]


def test_missing_required_value_raises_validation_error(env: pytest.MonkeyPatch) -> None:
    env.delenv("DB_HOST")

    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None)  # type: ignore[call-arg]

    assert error.value.errors()[0]["loc"] == ("db_host",)
    assert error.value.errors()[0]["type"] == "missing"
