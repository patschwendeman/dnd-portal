"""Shared fixtures for the API tests.

Starting the app (lifespan) runs the migrations and the seeder, so a reachable PostgreSQL is required
(DB_HOST/DB_PORT/... from the environment or backend/.env; see backend/CLAUDE.md).
The media folder is a temporary directory (MEDIA_DIR is set before `app` is imported); tests put their files there.
"""

import json
import os
import tempfile
from collections.abc import Iterator
from contextlib import nullcontext
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

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


@pytest.fixture
def reset_audio(client: TestClient) -> Iterator[None]:
    """Resets the music state kept in memory after the test (start state for the stored game table)."""
    from app.db.session import SessionLocal
    from app.realtime import push

    yield
    with SessionLocal() as session:
        push.reset_audio(session)


@pytest.fixture
def db(client: TestClient, reset_audio: None, monkeypatch: pytest.MonkeyPatch) -> Iterator[Session]:
    """Session in an outer transaction that is rolled back afterwards (commits become savepoints).

    Used by the routes (`get_db`) and by the WebSocket push, which otherwise opens its own session and would not see
    the uncommitted changes. A scene change also changes the music state, so it is reset afterwards (`reset_audio`).
    """
    from app.db.session import engine, get_db
    from app.main import app
    from app.realtime import push

    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint", autoflush=False)
        app.dependency_overrides[get_db] = lambda: session
        monkeypatch.setattr(push, "SessionLocal", lambda: nullcontext(session))
        try:
            yield session
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()
            transaction.rollback()


@pytest.fixture
def other_adventure(db: Session) -> dict[str, int]:
    """A second adventure with one Kampfszene and one Nicht-Kampfszene (inside the rolled-back transaction)."""
    from app.models import Adventure, Media, Scene

    adventure = Adventure(name="Zweites Abenteuer", description=None)
    media = [
        Media(kind="image", name=name, storage_key=f"adventure-test/{name}.jpg", content_type="image/jpeg")
        for name in ("wall", "ground_main", "ground_side")
    ]
    db.add_all([adventure, *media])
    db.flush()
    wall, ground_main, ground_side = media
    main_scene = Scene(
        adventure_id=adventure.id,
        name="Other fight",
        description="Elsewhere",
        main=True,
        wall_image_id=wall.id,
        ground_image_id=ground_main.id,
    )
    side_scene = Scene(
        adventure_id=adventure.id,
        name="Other village",
        description="Elsewhere",
        main=False,
        wall_image_id=wall.id,
        ground_image_id=ground_side.id,
    )
    db.add_all([main_scene, side_scene])
    db.commit()
    return {"id": adventure.id, "main_scene_id": main_scene.id, "side_scene_id": side_scene.id}


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
