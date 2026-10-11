"""Shared fixtures for the API tests.

Starting the app (lifespan) runs the migrations and the seeder, so a reachable PostgreSQL is required
(DB_HOST/DB_PORT/... from the environment or backend/.env; see backend/CLAUDE.md).
"""

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

SEED_DATA_PATH = Path(__file__).resolve().parent.parent / "app" / "db" / "data" / "seed_data.json"


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    from app.main import app

    # As a context manager the TestClient runs the lifespan (migrations and seeder).
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


@pytest.fixture(scope="session")
def seed() -> dict[str, Any]:
    with SEED_DATA_PATH.open(encoding="utf-8") as file:
        data: dict[str, Any] = json.load(file)
    return data


def with_ids(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Seed entries get autoincrement IDs in file order (1-based)."""
    return [{"id": index, **item} for index, item in enumerate(items, start=1)]


def image(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["id"], "name": item["name"], "source": item["source"]}


@pytest.fixture(scope="session")
def expected_scene_details(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Scenes in the `SceneDetail` schema: images and tracks (sorted by ID) with `id`, `name`, `source`."""
    walls = with_ids(seed["wall_images"])
    grounds = with_ids(seed["ground_images"])
    tracks = with_ids(seed["tracks"])
    return [
        {
            "id": scene["id"],
            "name": scene["name"],
            "description": scene["description"],
            "main": scene["main"],
            "wall_image": image(walls[scene["wall_image_id"] - 1]),
            "ground_image": image(grounds[scene["ground_image_id"] - 1]),
            "tracks": [image(track) for track in tracks if track["id"] in scene["track_ids"]],
        }
        for scene in with_ids(seed["scenes"])
    ]
