"""Tests for /maps: one `MapEntry` per Kampf-/Nicht-Kampfszene, including redirects."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.crud import scene as scene_crud


def media_source(item: dict[str, Any]) -> str:
    return f"/media/{item['storage_key']}"


@pytest.fixture(scope="module")
def expected_main_maps(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Kampfszenen (main: true) with their ground image."""
    media = seed["media"]
    return [
        {"id": scene_id, "source": media_source(media[scene["ground_image_id"] - 1])}
        for scene_id, scene in enumerate(seed["scenes"], start=1)
        if scene["main"] is True
    ]


@pytest.fixture(scope="module")
def expected_side_maps(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Nicht-Kampfszenen (main: false) with their wall image."""
    media = seed["media"]
    return [
        {"id": scene_id, "source": media_source(media[scene["wall_image_id"] - 1])}
        for scene_id, scene in enumerate(seed["scenes"], start=1)
        if scene["main"] is False
    ]


def test_read_main_maps_returns_ground_image_per_fight_scene(
    client: TestClient, expected_main_maps: list[dict[str, Any]]
) -> None:
    response = client.get("/maps/main")

    assert response.status_code == 200
    assert response.json() == expected_main_maps


def test_read_side_maps_returns_wall_image_per_non_fight_scene(
    client: TestClient, expected_side_maps: list[dict[str, Any]]
) -> None:
    response = client.get("/maps/side")

    assert response.status_code == 200
    assert response.json() == expected_side_maps


@pytest.mark.parametrize("maptype", ["main", "side"])
def test_trailing_slash_redirects_to_path_without_slash(client: TestClient, maptype: str) -> None:
    response = client.get(f"/maps/{maptype}/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == f"http://testserver/maps/{maptype}"


@pytest.mark.parametrize("maptype", ["main", "side"])
def test_trailing_slash_followed_returns_same_maps(client: TestClient, maptype: str) -> None:
    response = client.get(f"/maps/{maptype}/")

    assert response.status_code == 200
    assert response.json() == client.get(f"/maps/{maptype}").json()


@pytest.mark.parametrize("maptype", ["main", "side"])
def test_read_maps_returns_empty_list_without_matching_scenes(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, maptype: str
) -> None:
    monkeypatch.setattr(scene_crud, "read_scenes_by_main", lambda _db, _main, _adventure_id=None: [])

    response = client.get(f"/maps/{maptype}")

    assert response.status_code == 200
    assert response.json() == []
