"""Characterization tests for /maps: they pin the current behavior, including redirects."""

from typing import Any

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def expected_main_maps(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Kampfszenen (main: true) with their ground image."""
    grounds = seed["graphics_grounds"]
    return [
        {"id": scene_id, "source": grounds[scene["graphics_ground_id"] - 1]["source"]}
        for scene_id, scene in enumerate(seed["scenes"], start=1)
        if scene["main"] is True
    ]


@pytest.fixture(scope="module")
def expected_side_maps(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Nicht-Kampfszenen (main: false) with their wall image."""
    walls = seed["graphics_walls"]
    return [
        {"id": scene_id, "source": walls[scene["graphics_wall_id"] - 1]["source"]}
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
    # The frontend requests "maps/main/" and "maps/side/" (frontend/src/service/adminScreen.ts).
    response = client.get(f"/maps/{maptype}/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == f"http://testserver/maps/{maptype}"


@pytest.mark.parametrize("maptype", ["main", "side"])
def test_trailing_slash_followed_returns_same_maps(client: TestClient, maptype: str) -> None:
    response = client.get(f"/maps/{maptype}/")

    assert response.status_code == 200
    assert response.json() == client.get(f"/maps/{maptype}").json()
