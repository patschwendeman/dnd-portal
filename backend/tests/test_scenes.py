"""Tests for /scenes/{id}: single scene in the `SceneDetail` schema, 404 for unknown IDs, no global list."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

SCENE_FIELDS = {"id", "name", "description", "main", "wall_image", "ground_image", "tracks"}
MEDIA_FIELDS = {"id", "name", "source"}


def test_read_scene_contains_only_schema_fields(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    for expected in expected_scene_details:
        scene = client.get(f"/scenes/{expected['id']}").json()

        assert set(scene) == SCENE_FIELDS
        assert set(scene["wall_image"]) == MEDIA_FIELDS
        assert set(scene["ground_image"]) == MEDIA_FIELDS
        assert all(set(track) == MEDIA_FIELDS for track in scene["tracks"])
        assert [track["id"] for track in scene["tracks"]] == sorted(track["id"] for track in scene["tracks"])


def test_read_scene_by_id_returns_scene_with_relations(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    for expected in (expected_scene_details[0], expected_scene_details[4], expected_scene_details[-1]):
        response = client.get(f"/scenes/{expected['id']}")

        assert response.status_code == 200
        assert response.json() == expected


def test_read_scene_by_unknown_id_returns_404(client: TestClient, expected_scene_details: list[dict[str, Any]]) -> None:
    response = client.get(f"/scenes/{len(expected_scene_details) + 1}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Scene not found"}


def test_removed_details_path_with_id_does_not_exist(client: TestClient) -> None:
    response = client.get("/scenes/details/1")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


def test_removed_details_path_with_slash_returns_no_scene_list(client: TestClient) -> None:
    response = client.get("/scenes/details/")

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["path", "scene_id"]


def test_removed_details_path_is_rejected_as_invalid_scene_id(client: TestClient) -> None:
    response = client.get("/scenes/details", follow_redirects=False)

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "int_parsing"
    assert response.json()["detail"][0]["loc"] == ["path", "scene_id"]


@pytest.mark.parametrize("path", ["/scenes", "/scenes/", "/maps/main", "/maps/side"])
def test_removed_global_list_endpoints_do_not_exist(client: TestClient, path: str) -> None:
    response = client.get(path)

    assert response.status_code in (404, 405)
