"""Tests for /table: state of the game table (active adventure, its active scene, theme), GET and PATCH; /table/join.

Changing tests use the fixture `db` (tests/conftest.py): everything is rolled back afterwards, so the shared test DB
keeps its state.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

STATE_FIELDS = {"active_adventure_id", "active_scene_id", "theme", "wall_overlay"}
ADVENTURE_NOT_FOUND = {"detail": "Adventure not found"}


def unknown_adventure_id(expected_adventures: list[dict[str, Any]]) -> int:
    return max(adventure["id"] for adventure in expected_adventures) + 1000


def test_get_returns_the_stored_state(client: TestClient, expected_adventures: list[dict[str, Any]]) -> None:
    from app.db.session import SessionLocal
    from app.models import GameTable

    response = client.get("/table")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == STATE_FIELDS
    with SessionLocal() as session:
        row = session.get(GameTable, 1)
        assert row is not None
        assert (body["active_adventure_id"], body["theme"]) == (row.active_adventure_id, row.theme)
    # Migration 0004 activates the smallest adventure, or none if the DB was empty before (the seeder runs after it).
    assert body["active_adventure_id"] in {None, expected_adventures[0]["id"]}
    assert body["active_scene_id"] is None
    assert body["theme"] == "dark"
    assert body["wall_overlay"] == "off"


def test_patch_sets_active_adventure_and_returns_its_active_scene(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["second_scene_id"]})

    response = client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

    assert response.status_code == 200
    expected = {
        "active_adventure_id": other_adventure["id"],
        "active_scene_id": other_adventure["second_scene_id"],
        "theme": "dark",
        "wall_overlay": "off",
    }
    assert response.json() == expected
    assert client.get("/table").json() == expected


def test_active_scene_follows_the_active_adventure(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})

    assert client.get("/table").json()["active_scene_id"] == 5

    client.patch("/table", json={"active_adventure_id": other_adventure["id"]})
    assert client.get("/table").json()["active_scene_id"] is None

    client.patch("/table", json={"active_adventure_id": 1})
    assert client.get("/table").json()["active_scene_id"] == 5


def test_patch_sets_theme_and_keeps_unset_fields(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1})

    response = client.patch("/table", json={"theme": "tavern"})

    assert response.status_code == 200
    assert response.json() == {
        "active_adventure_id": 1,
        "active_scene_id": None,
        "theme": "tavern",
        "wall_overlay": "off",
    }
    assert client.patch("/table", json={"theme": "dark"}).json()["theme"] == "dark"


def test_patch_with_empty_body_changes_nothing(client: TestClient, db: Session) -> None:
    before = client.get("/table").json()

    response = client.patch("/table", json={})

    assert response.status_code == 200
    assert response.json() == before


def test_patch_accepts_null_adventure(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1, "theme": "tavern"})
    client.patch("/adventures/1", json={"active_scene_id": 5})

    response = client.patch("/table", json={"active_adventure_id": None})

    assert response.status_code == 200
    assert response.json() == {
        "active_adventure_id": None,
        "active_scene_id": None,
        "theme": "tavern",
        "wall_overlay": "off",
    }


def test_patch_rejects_unknown_adventure(
    client: TestClient, db: Session, expected_adventures: list[dict[str, Any]]
) -> None:
    before = client.get("/table").json()

    response = client.patch(
        "/table", json={"active_adventure_id": unknown_adventure_id(expected_adventures), "theme": "tavern"}
    )

    assert response.status_code == 422
    assert response.json() == ADVENTURE_NOT_FOUND
    assert client.get("/table").json() == before


@pytest.mark.parametrize("theme", ["light", None, 1])
def test_patch_rejects_invalid_theme(client: TestClient, db: Session, theme: Any) -> None:
    before = client.get("/table").json()

    response = client.patch("/table", json={"theme": theme})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "theme"]
    assert client.get("/table").json() == before


def test_patch_sets_wall_overlay_and_keeps_unset_fields(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1, "theme": "tavern"})
    client.patch("/adventures/1", json={"active_scene_id": 5})

    response = client.patch("/table", json={"wall_overlay": "world"})

    assert response.status_code == 200
    expected = {"active_adventure_id": 1, "active_scene_id": 5, "theme": "tavern", "wall_overlay": "world"}
    assert response.json() == expected
    assert client.get("/table").json() == expected
    assert client.patch("/table", json={"theme": "dark"}).json()["wall_overlay"] == "world"
    assert client.patch("/table", json={"wall_overlay": "off"}).json() == {
        **expected,
        "theme": "dark",
        "wall_overlay": "off",
    }


@pytest.mark.parametrize("wall_overlay", ["map", "WORLD", None, 1])
def test_patch_rejects_invalid_wall_overlay(client: TestClient, db: Session, wall_overlay: Any) -> None:
    client.patch("/table", json={"wall_overlay": "world"})
    before = client.get("/table").json()

    response = client.patch("/table", json={"wall_overlay": wall_overlay})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "wall_overlay"]
    assert client.get("/table").json() == before


def test_rejected_patch_keeps_wall_overlay(
    client: TestClient, db: Session, expected_adventures: list[dict[str, Any]]
) -> None:
    response = client.patch(
        "/table", json={"active_adventure_id": unknown_adventure_id(expected_adventures), "wall_overlay": "world"}
    )

    assert response.status_code == 422
    assert client.get("/table").json()["wall_overlay"] == "off"


def test_scene_change_of_the_active_adventure_closes_the_wall_overlay(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})
    client.patch("/table", json={"wall_overlay": "world"})

    client.patch("/adventures/1", json={"active_scene_id": 6})

    assert client.get("/table").json()["wall_overlay"] == "off"

    client.patch("/table", json={"wall_overlay": "world"})
    client.patch("/adventures/1", json={"active_scene_id": None})

    assert client.get("/table").json()["wall_overlay"] == "off"


def test_other_adventure_writes_keep_the_wall_overlay(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})
    client.patch("/table", json={"wall_overlay": "world"})

    client.patch("/adventures/1", json={"active_scene_id": 5})
    client.patch("/adventures/1", json={"global_level": 3})
    client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["first_scene_id"]})
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/table", json={"theme": "tavern"})

    assert client.get("/table").json()["wall_overlay"] == "world"


def test_adventure_change_closes_the_wall_overlay(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1, "wall_overlay": "world"})

    response = client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

    assert response.json()["wall_overlay"] == "off"

    client.patch("/table", json={"wall_overlay": "world"})
    assert client.patch("/table", json={"active_adventure_id": None}).json()["wall_overlay"] == "off"


def test_wall_overlay_set_with_the_adventure_change_wins(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})

    response = client.patch("/table", json={"active_adventure_id": other_adventure["id"], "wall_overlay": "world"})

    assert response.json()["wall_overlay"] == "world"


def test_deleting_the_active_adventure_clears_it(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    from sqlalchemy import text

    client.patch("/table", json={"active_adventure_id": other_adventure["id"]})
    db.execute(text("DELETE FROM scene WHERE adventure_id = :id"), {"id": other_adventure["id"]})
    db.execute(text("DELETE FROM adventure WHERE id = :id"), {"id": other_adventure["id"]})
    db.commit()
    db.expire_all()

    assert client.get("/table").json()["active_adventure_id"] is None


@pytest.mark.parametrize("player_url", ["http://192.168.0.10:8080/", None])
def test_join_returns_the_configured_player_url(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, player_url: str | None
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "player_url", player_url)

    response = client.get("/table/join")

    assert response.status_code == 200
    assert response.json() == {"player_url": player_url}
