"""CORS: only configured origins are allowed, without credentials (default origins from app/core/config.py)."""

import pytest
from fastapi.testclient import TestClient

ALLOWED_ORIGIN = "http://localhost:5173"
FOREIGN_ORIGIN = "http://evil.example"


@pytest.fixture(autouse=True)
def default_origins() -> None:
    from app.core.config import settings

    if ALLOWED_ORIGIN not in settings.cors_origins or FOREIGN_ORIGIN in settings.cors_origins:
        pytest.skip("CORS_ORIGINS overrides the default origins this test relies on")


def test_preflight_from_allowed_origin_is_allowed_without_credentials(client: TestClient) -> None:
    response = client.options("/scenes", headers={"Origin": ALLOWED_ORIGIN, "Access-Control-Request-Method": "GET"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "access-control-allow-credentials" not in response.headers


def test_get_from_allowed_origin_is_allowed_without_credentials(client: TestClient) -> None:
    response = client.get("/scenes", headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "access-control-allow-credentials" not in response.headers


def test_preflight_from_foreign_origin_is_rejected(client: TestClient) -> None:
    response = client.options("/scenes", headers={"Origin": FOREIGN_ORIGIN, "Access-Control-Request-Method": "GET"})

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_get_from_foreign_origin_has_no_allow_origin_header(client: TestClient) -> None:
    response = client.get("/scenes", headers={"Origin": FOREIGN_ORIGIN})

    assert "access-control-allow-origin" not in response.headers
