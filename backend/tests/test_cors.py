"""CORS: only configured origins and the methods GET/PATCH are allowed, without credentials (default origins from
app/core/config.py)."""

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
    response = client.options("/adventures", headers={"Origin": ALLOWED_ORIGIN, "Access-Control-Request-Method": "GET"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "access-control-allow-credentials" not in response.headers


def test_get_from_allowed_origin_is_allowed_without_credentials(client: TestClient) -> None:
    response = client.get("/adventures", headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "access-control-allow-credentials" not in response.headers


def test_preflight_from_foreign_origin_is_rejected(client: TestClient) -> None:
    response = client.options("/adventures", headers={"Origin": FOREIGN_ORIGIN, "Access-Control-Request-Method": "GET"})

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_get_from_foreign_origin_has_no_allow_origin_header(client: TestClient) -> None:
    response = client.get("/adventures", headers={"Origin": FOREIGN_ORIGIN})

    assert "access-control-allow-origin" not in response.headers


def test_patch_preflight_from_allowed_origin_is_allowed(client: TestClient) -> None:
    headers = {
        "Origin": ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "content-type",
    }
    response = client.options("/adventures/1", headers=headers)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "PATCH" in response.headers["access-control-allow-methods"]
    assert "access-control-allow-credentials" not in response.headers


def test_patch_preflight_from_foreign_origin_is_rejected(client: TestClient) -> None:
    headers = {
        "Origin": FOREIGN_ORIGIN,
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "content-type",
    }
    response = client.options("/adventures/1", headers=headers)

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


@pytest.mark.parametrize("method", ["POST", "PUT", "DELETE"])
def test_preflight_for_other_write_methods_is_rejected(client: TestClient, method: str) -> None:
    response = client.options(
        "/adventures/1", headers={"Origin": ALLOWED_ORIGIN, "Access-Control-Request-Method": method}
    )

    assert response.status_code == 400
