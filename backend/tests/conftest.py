"""Shared fixtures for the API tests.

Starting the app (lifespan) runs the migrations and the seeder, so a reachable PostgreSQL is required
(DB_HOST/DB_PORT/... from the environment or backend/.env; see backend/CLAUDE.md).
The media folder is a temporary directory (MEDIA_DIR is set before `app` is imported); tests put their files there.
"""

import json
import os
import tempfile
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

SEED_DATA_PATH = Path(__file__).resolve().parent.parent / "app" / "db" / "data" / "seed_data.json"

# Settings are read on the first import of app.core.config, so the media folder has to be set at collection time.
# Inside an own temporary directory, so that tests can place files next to (outside of) the media folder.
MEDIA_DIR = Path(tempfile.mkdtemp(prefix="dnd-tests-")) / "media"
MEDIA_DIR.mkdir()
os.environ["MEDIA_DIR"] = str(MEDIA_DIR)


@pytest.fixture(scope="session")
def media_dir() -> Path:
    return MEDIA_DIR


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


def media_source(item: dict[str, Any]) -> str:
    return f"/media/{item['storage_key']}"


def image(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["id"], "name": item["name"], "source": media_source(item)}


@pytest.fixture(scope="session")
def expected_scene_details(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Scenes in the `SceneDetail` schema: images and tracks (sorted by ID) with `id`, `name`, `source`."""
    media = with_ids(seed["media"])
    return [
        {
            "id": scene["id"],
            "name": scene["name"],
            "description": scene["description"],
            "main": scene["main"],
            "wall_image": image(media[scene["wall_image_id"] - 1]),
            "ground_image": image(media[scene["ground_image_id"] - 1]),
            "tracks": [image(item) for item in media if item["id"] in scene["track_ids"]],
        }
        for scene in with_ids(seed["scenes"])
    ]


@pytest.fixture(scope="session")
def expected_adventures(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Adventures in the `AdventureSummary` schema."""
    return [
        {"id": adventure["id"], "name": adventure["name"], "description": adventure["description"]}
        for adventure in with_ids(seed["adventures"])
    ]


@pytest.fixture(scope="session")
def expected_adventure_details(seed: dict[str, Any]) -> list[dict[str, Any]]:
    """Adventures in the `AdventureDetail` schema as seeded: no active scene, players (sorted by ID) with avatar."""
    media = with_ids(seed["media"])
    players = with_ids(seed["players"])
    return [
        {
            "id": adventure["id"],
            "name": adventure["name"],
            "description": adventure["description"],
            "global_level": adventure["global_level"],
            "active_scene_id": None,
            "players": [
                {
                    "id": player["id"],
                    "player_name": player["player_name"],
                    "character_name": player["character_name"],
                    "race": player["race"],
                    "character_class": player["character_class"],
                    "avatar": image(media[player["avatar_media_id"] - 1]) if player["avatar_media_id"] else None,
                }
                for player in players
                if player["adventure_id"] == adventure["id"]
            ],
        }
        for adventure in with_ids(seed["adventures"])
    ]
