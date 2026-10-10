"""Shared fixtures for the characterization tests.

Starting the app (lifespan) creates the tables and runs the seeder, so a reachable PostgreSQL is required
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

    # As a context manager the TestClient runs the lifespan (create_all and seeder).
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


@pytest.fixture(scope="session")
def expected_scenes(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Scene rows as returned without relations: `music_id` column is never set by the seeder."""
    return [
        {
            "id": scene["id"],
            "name": scene["name"],
            "description": scene["description"],
            "main": scene["main"],
            "graphics_wall_id": scene["graphics_wall_id"],
            "graphics_ground_id": scene["graphics_ground_id"],
            "music_id": None,
        }
        for scene in with_ids(seed["scenes"])
    ]


@pytest.fixture(scope="session")
def expected_scene_details(seed: dict[str, Any], expected_scenes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    walls = with_ids(seed["graphics_walls"])
    grounds = with_ids(seed["graphics_grounds"])
    music = with_ids(seed["music"])
    details = []
    for scene, seed_scene in zip(expected_scenes, seed["scenes"], strict=True):
        wall = walls[scene["graphics_wall_id"] - 1]
        ground = grounds[scene["graphics_ground_id"] - 1]
        details.append(
            {
                **scene,
                "graphics_wall": {"id": wall["id"], "name": wall["name"], "source": wall["source"]},
                "graphics_ground": {
                    "id": ground["id"],
                    "name": ground["name"],
                    "source": ground["source"],
                    "main": ground.get("main"),
                },
                "music": sorted(
                    (
                        {"id": m["id"], "name": m["name"], "source": m["source"]}
                        for m in music
                        if m["id"] in seed_scene["music_id"]
                    ),
                    key=lambda m: m["id"],
                ),
            }
        )
    return details
