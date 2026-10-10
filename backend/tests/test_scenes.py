"""Characterization tests for /scenes: they pin the current behavior, including known issues."""

from typing import Any

from fastapi.testclient import TestClient


def sort_music(detail: dict[str, Any]) -> dict[str, Any]:
    """The order of the many-to-many `music` list is not defined by the query; compare it sorted by ID."""
    return {**detail, "music": sorted(detail["music"], key=lambda m: m["id"])}


def test_read_scenes_returns_all_scenes_ordered_by_id_without_relations(
    client: TestClient, expected_scenes: list[dict[str, Any]]
) -> None:
    response = client.get("/scenes")

    assert response.status_code == 200
    assert response.json() == expected_scenes


def test_read_scene_by_id_returns_scene_without_relations(
    client: TestClient, expected_scenes: list[dict[str, Any]]
) -> None:
    for expected in (expected_scenes[0], expected_scenes[-1]):
        response = client.get(f"/scenes/{expected['id']}")

        assert response.status_code == 200
        assert response.json() == expected


def test_read_scene_by_unknown_id_returns_500(client: TestClient, expected_scenes: list[dict[str, Any]]) -> None:
    # known issue: the service raises ValueError instead of returning None, so the route's 404 is never reached
    response = client.get(f"/scenes/{len(expected_scenes) + 1}")

    assert response.status_code == 500


def test_read_scene_details_returns_all_scenes_with_relations(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    response = client.get("/scenes/details/")

    assert response.status_code == 200
    assert [sort_music(detail) for detail in response.json()] == expected_scene_details


def test_read_scene_details_without_trailing_slash_is_matched_as_scene_id(client: TestClient) -> None:
    # known issue: "/scenes/details" matches "/scenes/{scene_id}" first, so "details" fails integer parsing
    response = client.get("/scenes/details", follow_redirects=False)

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "int_parsing"
    assert response.json()["detail"][0]["loc"] == ["path", "scene_id"]


def test_read_scene_detail_by_id_returns_scene_with_relations(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    for expected in (expected_scene_details[0], expected_scene_details[4], expected_scene_details[-1]):
        response = client.get(f"/scenes/details/{expected['id']}")

        assert response.status_code == 200
        assert sort_music(response.json()) == expected


def test_read_scene_detail_by_unknown_id_returns_all_scene_details(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    # known issue: the service falls through to returning the whole list instead of signaling "not found"
    response = client.get(f"/scenes/details/{len(expected_scene_details) + 1}")

    assert response.status_code == 200
    assert [sort_music(detail) for detail in response.json()] == expected_scene_details
