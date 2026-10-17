"""Tests for /adventures: list, detail with players, scenes and maps per adventure (incl. trailing-slash redirects),
PATCH, 404 for unknown IDs.

Tests that change data use the fixture `db`: the API runs on a session in an outer transaction that is rolled back
afterwards (commits become savepoints), so the shared test DB keeps the seed state. The persistence test commits for
real and restores the seed state itself.
"""

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.crud import scene as scene_crud
from app.models import Adventure, Media, Scene

ADVENTURE_FIELDS = {"id", "name", "description", "global_level", "active_scene_id", "players"}
PLAYER_FIELDS = {"id", "player_name", "character_name", "race", "character_class", "avatar"}
NOT_FOUND = {"detail": "Adventure not found"}
SCENE_NOT_IN_ADVENTURE = {"detail": "Scene does not belong to adventure"}
SUB_PATHS = ["", "/scenes", "/maps/main", "/maps/side"]
SCENE_FIELDS = {"id", "name", "description", "main", "wall_image", "ground_image", "tracks"}
MEDIA_FIELDS = {"id", "name", "source"}


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


@pytest.fixture
def db(client: TestClient) -> Iterator[Session]:
    from app.db.session import engine, get_db
    from app.main import app

    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint", autoflush=False)
        app.dependency_overrides[get_db] = lambda: session
        try:
            yield session
        finally:
            app.dependency_overrides.pop(get_db, None)
            session.close()
            transaction.rollback()


@pytest.fixture
def other_adventure(db: Session) -> dict[str, int]:
    """A second adventure with one Kampfszene and one Nicht-Kampfszene (inside the rolled-back transaction)."""
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


def unknown_adventure_id(expected_adventures: list[dict[str, Any]]) -> int:
    return max(adventure["id"] for adventure in expected_adventures) + 1000


def test_read_adventures_returns_seeded_adventures(
    client: TestClient, expected_adventures: list[dict[str, Any]]
) -> None:
    response = client.get("/adventures")

    assert response.status_code == 200
    assert response.json() == expected_adventures
    assert [adventure["name"] for adventure in response.json()] == ["Erstes Abenteuer"]


def test_read_adventures_returns_empty_list_without_adventures(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.crud import adventure as adventure_crud

    monkeypatch.setattr(adventure_crud, "read_adventures", lambda _db: [])

    response = client.get("/adventures")

    assert response.status_code == 200
    assert response.json() == []


def test_read_adventure_returns_detail_with_players(
    client: TestClient, expected_adventure_details: list[dict[str, Any]]
) -> None:
    response = client.get("/adventures/1")

    assert response.status_code == 200
    assert response.json() == expected_adventure_details[0]
    body = response.json()
    assert set(body) == ADVENTURE_FIELDS
    assert (body["global_level"], body["active_scene_id"]) == (1, None)
    assert len(body["players"]) == 4
    assert all(set(player) == PLAYER_FIELDS and player["avatar"] is None for player in body["players"])


def test_read_adventure_returns_player_avatar_as_image(client: TestClient, db: Session) -> None:
    from app.models import Player

    player = db.get(Player, 1)
    assert player is not None
    player.avatar_media_id = 1
    db.commit()

    response = client.get("/adventures/1")

    assert response.status_code == 200
    avatar = response.json()["players"][0]["avatar"]
    assert avatar == {"id": 1, "name": "Forest", "source": "/media/images/wall_screen/forest.jpg"}


@pytest.mark.parametrize("sub_path", SUB_PATHS)
def test_unknown_adventure_returns_404(
    client: TestClient, expected_adventures: list[dict[str, Any]], sub_path: str
) -> None:
    response = client.get(f"/adventures/{unknown_adventure_id(expected_adventures)}{sub_path}")

    assert response.status_code == 404
    assert response.json() == NOT_FOUND


def test_scenes_of_adventure_return_all_seeded_scenes_with_relations(
    client: TestClient, expected_scene_details: list[dict[str, Any]]
) -> None:
    response = client.get("/adventures/1/scenes")

    assert response.status_code == 200
    assert response.json() == expected_scene_details


def test_scenes_of_adventure_contain_only_schema_fields(client: TestClient) -> None:
    for scene in client.get("/adventures/1/scenes").json():
        assert set(scene) == SCENE_FIELDS
        assert set(scene["wall_image"]) == MEDIA_FIELDS
        assert set(scene["ground_image"]) == MEDIA_FIELDS
        assert all(set(track) == MEDIA_FIELDS for track in scene["tracks"])


def test_scenes_of_adventure_return_empty_list_without_scenes(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(scene_crud, "read_scenes", lambda _db, _adventure_id: [])

    response = client.get("/adventures/1/scenes")

    assert response.status_code == 200
    assert response.json() == []


def test_main_maps_of_adventure_return_ground_image_per_fight_scene(
    client: TestClient, expected_main_maps: list[dict[str, Any]]
) -> None:
    response = client.get("/adventures/1/maps/main")

    assert response.status_code == 200
    assert response.json() == expected_main_maps


def test_side_maps_of_adventure_return_wall_image_per_non_fight_scene(
    client: TestClient, expected_side_maps: list[dict[str, Any]]
) -> None:
    response = client.get("/adventures/1/maps/side")

    assert response.status_code == 200
    assert response.json() == expected_side_maps


@pytest.mark.parametrize("map_type", ["main", "side"])
def test_maps_trailing_slash_redirects_to_path_without_slash(client: TestClient, map_type: str) -> None:
    response = client.get(f"/adventures/1/maps/{map_type}/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == f"http://testserver/adventures/1/maps/{map_type}"


@pytest.mark.parametrize("map_type", ["main", "side"])
def test_maps_trailing_slash_followed_returns_same_maps(client: TestClient, map_type: str) -> None:
    response = client.get(f"/adventures/1/maps/{map_type}/")

    assert response.status_code == 200
    assert response.json() == client.get(f"/adventures/1/maps/{map_type}").json()


@pytest.mark.parametrize("map_type", ["main", "side"])
def test_maps_of_adventure_return_empty_list_without_matching_scenes(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, map_type: str
) -> None:
    monkeypatch.setattr(scene_crud, "read_scenes_by_main", lambda _db, _main, _adventure_id: [])

    response = client.get(f"/adventures/1/maps/{map_type}")

    assert response.status_code == 200
    assert response.json() == []


def test_scenes_are_filtered_by_adventure(
    client: TestClient, other_adventure: dict[str, int], expected_scene_details: list[dict[str, Any]]
) -> None:
    own = client.get("/adventures/1/scenes")
    other = client.get(f"/adventures/{other_adventure['id']}/scenes")

    assert own.json() == expected_scene_details
    assert [scene["id"] for scene in other.json()] == [
        other_adventure["main_scene_id"],
        other_adventure["side_scene_id"],
    ]
    assert other.json()[0]["ground_image"]["source"] == "/media/adventure-test/ground_main.jpg"


def test_maps_are_filtered_by_adventure(client: TestClient, other_adventure: dict[str, int]) -> None:
    other_main = client.get(f"/adventures/{other_adventure['id']}/maps/main")
    other_side = client.get(f"/adventures/{other_adventure['id']}/maps/side")
    own_ids = {
        entry["id"] for map_type in ("main", "side") for entry in client.get(f"/adventures/1/maps/{map_type}").json()
    }

    assert other_main.json() == [
        {"id": other_adventure["main_scene_id"], "source": "/media/adventure-test/ground_main.jpg"}
    ]
    assert other_side.json() == [{"id": other_adventure["side_scene_id"], "source": "/media/adventure-test/wall.jpg"}]
    assert own_ids.isdisjoint({other_adventure["main_scene_id"], other_adventure["side_scene_id"]})


def test_patch_sets_and_clears_active_scene(client: TestClient, db: Session) -> None:
    response = client.patch("/adventures/1", json={"active_scene_id": 5})

    assert response.status_code == 200
    assert response.json()["active_scene_id"] == 5
    assert client.get("/adventures/1").json()["active_scene_id"] == 5

    response = client.patch("/adventures/1", json={"active_scene_id": None})

    assert response.status_code == 200
    assert response.json()["active_scene_id"] is None
    assert client.get("/adventures/1").json()["active_scene_id"] is None


def test_patch_sets_global_level_and_keeps_unset_fields(client: TestClient, db: Session) -> None:
    client.patch("/adventures/1", json={"active_scene_id": 5})

    response = client.patch("/adventures/1", json={"global_level": 7})

    assert response.status_code == 200
    assert (response.json()["global_level"], response.json()["active_scene_id"]) == (7, 5)


def test_patch_returns_detail_with_players(
    client: TestClient, db: Session, expected_adventure_details: list[dict[str, Any]]
) -> None:
    response = client.patch("/adventures/1", json={})

    assert response.status_code == 200
    assert response.json() == expected_adventure_details[0]


@pytest.mark.parametrize("body", [{"active_scene_id": 5}, {"global_level": 2}])
def test_patch_unknown_adventure_returns_404(
    client: TestClient, db: Session, expected_adventures: list[dict[str, Any]], body: dict[str, Any]
) -> None:
    response = client.patch(f"/adventures/{unknown_adventure_id(expected_adventures)}", json=body)

    assert response.status_code == 404
    assert response.json() == NOT_FOUND


def test_patch_rejects_unknown_scene(
    client: TestClient, db: Session, expected_scene_details: list[dict[str, Any]]
) -> None:
    before = client.get("/adventures/1").json()

    response = client.patch("/adventures/1", json={"active_scene_id": len(expected_scene_details) + 1000})

    assert response.status_code == 422
    assert response.json() == SCENE_NOT_IN_ADVENTURE
    assert client.get("/adventures/1").json() == before


def test_patch_rejects_scene_of_other_adventure(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    before = client.get("/adventures/1").json()

    response = client.patch(
        "/adventures/1", json={"active_scene_id": other_adventure["main_scene_id"], "global_level": 3}
    )

    assert response.status_code == 422
    assert response.json() == SCENE_NOT_IN_ADVENTURE
    assert client.get("/adventures/1").json() == before
    own = client.patch(
        f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["main_scene_id"]}
    )
    assert own.json()["active_scene_id"] == other_adventure["main_scene_id"]


@pytest.mark.parametrize("level", [0, 21, None])
def test_patch_rejects_invalid_global_level(client: TestClient, db: Session, level: int | None) -> None:
    before = client.get("/adventures/1").json()

    response = client.patch("/adventures/1", json={"global_level": level})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "global_level"]
    assert client.get("/adventures/1").json() == before


@pytest.mark.parametrize("level", [1, 20])
def test_patch_accepts_global_level_bounds(client: TestClient, db: Session, level: int) -> None:
    response = client.patch("/adventures/1", json={"global_level": level})

    assert response.status_code == 200
    assert response.json()["global_level"] == level


def test_patch_persists_active_scene_across_sessions(client: TestClient) -> None:
    """Without the rolled-back transaction: the value is committed and read back with a new session."""
    from app.db.session import SessionLocal

    try:
        response = client.patch("/adventures/1", json={"active_scene_id": 5})
        assert response.status_code == 200

        with SessionLocal() as session:
            adventure = session.get(Adventure, 1)
            assert adventure is not None
            assert adventure.active_scene_id == 5
    finally:
        client.patch("/adventures/1", json={"active_scene_id": None})

    with SessionLocal() as session:
        adventure = session.get(Adventure, 1)
        assert adventure is not None
        assert adventure.active_scene_id is None
