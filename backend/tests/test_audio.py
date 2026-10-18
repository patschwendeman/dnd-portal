"""Tests for the music state of the game table: GET/PATCH /table/audio, POST /table/audio/next and POST /table/sounds.

The state is kept in memory (app/realtime/audio.py); the fixture `reset_audio` restores the start state after each
test. Scene changes use the fixture `db` (tests/conftest.py), which is rolled back afterwards.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import media_source, with_ids

pytestmark = pytest.mark.usefixtures("reset_audio")

AUDIO_FIELDS = {"playing", "track", "volume", "output_ready"}
DEFAULT_MUSIC_KEY = "music/side/forest/From_Past_To_Present.mp3"
# A scene of the seed with many tracks
SCENE_WITH_TRACKS = 5


def track(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["id"], "name": item["name"], "source": media_source(item)}


@pytest.fixture(scope="session")
def default_track(seed: dict[str, Any]) -> dict[str, Any]:
    return next(track(item) for item in with_ids(seed["media"]) if item["storage_key"] == DEFAULT_MUSIC_KEY)


def scene_tracks(expected_scene_details: list[dict[str, Any]], scene_id: int) -> list[dict[str, Any]]:
    return next(scene["tracks"] for scene in expected_scene_details if scene["id"] == scene_id)


@pytest.fixture
def first_track(monkeypatch: pytest.MonkeyPatch) -> None:
    """The random source always picks the first candidate."""
    from app.realtime.audio import audio

    monkeypatch.setattr(audio, "random", lambda: 0.0)


def activate_scene(client: TestClient, scene_id: int) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    assert client.patch("/adventures/1", json={"active_scene_id": scene_id}).status_code == 200


def test_get_returns_the_start_state(
    client: TestClient, default_track: dict[str, Any], expected_scene_details: list[dict[str, Any]]
) -> None:
    active_scene_id = client.get("/table").json()["active_scene_id"]

    response = client.get("/table/audio")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == AUDIO_FIELDS
    assert (body["playing"], body["volume"], body["output_ready"]) == (False, 10, False)
    if active_scene_id is None:
        assert body["track"] == default_track
    else:
        assert body["track"] in scene_tracks(expected_scene_details, active_scene_id)


def test_without_active_scene_the_default_music_is_the_playlist(
    client: TestClient, db: Session, default_track: dict[str, Any], expected_scene_details: list[dict[str, Any]]
) -> None:
    activate_scene(client, SCENE_WITH_TRACKS)
    assert client.get("/table/audio").json()["track"] in scene_tracks(expected_scene_details, SCENE_WITH_TRACKS)

    client.patch("/table", json={"active_adventure_id": None})

    assert client.get("/table/audio").json()["track"] == default_track
    # The only track: "next" stays with it
    assert client.post("/table/audio/next").json()["track"] == default_track


def test_missing_default_music_gives_an_empty_playlist(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.config import settings
    from app.db.session import SessionLocal
    from app.realtime import push

    monkeypatch.setattr(settings, "default_music_key", "music/missing.mp3")
    with SessionLocal() as session:
        push.audio.reset(None, push.audio_service.get_playlist(session, None))

    assert client.get("/table/audio").json()["track"] is None
    assert client.patch("/table/audio", json={"playing": True}).json()["playing"] is False


def test_patch_sets_playing_and_volume_and_keeps_unset_fields(client: TestClient) -> None:
    before = client.get("/table/audio").json()

    response = client.patch("/table/audio", json={"playing": True})

    assert response.status_code == 200
    assert response.json() == {**before, "playing": True}
    assert client.patch("/table/audio", json={"volume": 55}).json() == {**before, "playing": True, "volume": 55}
    assert client.patch("/table/audio", json={"playing": False, "volume": 0}).json() == {
        **before,
        "playing": False,
        "volume": 0,
    }
    assert client.patch("/table/audio", json={"volume": 100}).json()["volume"] == 100
    assert client.patch("/table/audio", json={}).json() == {**before, "volume": 100}
    assert client.get("/table/audio").json() == {**before, "volume": 100}


@pytest.mark.parametrize(
    ("body", "field"),
    [
        ({"volume": -1}, "volume"),
        ({"volume": 101}, "volume"),
        ({"volume": None}, "volume"),
        ({"playing": None}, "playing"),
    ],
)
def test_patch_rejects_invalid_values(client: TestClient, body: dict[str, Any], field: str) -> None:
    before = client.get("/table/audio").json()

    response = client.patch("/table/audio", json=body)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]
    assert client.get("/table/audio").json() == before


def test_next_picks_another_track_and_keeps_playing(
    client: TestClient, db: Session, first_track: None, expected_scene_details: list[dict[str, Any]]
) -> None:
    tracks = scene_tracks(expected_scene_details, SCENE_WITH_TRACKS)
    activate_scene(client, SCENE_WITH_TRACKS)
    client.patch("/table/audio", json={"playing": True})
    assert client.get("/table/audio").json()["track"] == tracks[0]

    response = client.post("/table/audio/next")

    assert response.status_code == 200
    assert response.json()["track"] == tracks[1]
    assert response.json()["playing"] is True
    assert client.post("/table/audio/next").json()["track"] == tracks[0]


def test_scene_change_loads_the_new_playlist_and_keeps_playing(
    client: TestClient, db: Session, expected_scene_details: list[dict[str, Any]]
) -> None:
    activate_scene(client, 1)
    client.patch("/table/audio", json={"playing": True, "volume": 30})

    client.patch("/adventures/1", json={"active_scene_id": SCENE_WITH_TRACKS})

    body = client.get("/table/audio").json()
    assert body["track"] in scene_tracks(expected_scene_details, SCENE_WITH_TRACKS)
    assert (body["playing"], body["volume"]) == (True, 30)


def test_scene_without_tracks_gives_an_empty_playlist(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["main_scene_id"]})
    client.patch("/table/audio", json={"playing": True})

    client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

    body = client.get("/table/audio").json()
    assert body["track"] is None
    # Music that was playing keeps the state, but play cannot be started without a track
    assert body["playing"] is True
    client.patch("/table/audio", json={"playing": False})
    assert client.patch("/table/audio", json={"playing": True}).json()["playing"] is False
    assert client.post("/table/audio/next").json()["track"] is None


@pytest.mark.parametrize(
    "name", ["heal", "bottle", "buff", "music_1", "music_2", "spell_1", "spell_2", "debuff_1", "debuff_2", "lock"]
)
def test_sound_without_output_is_accepted(client: TestClient, name: str) -> None:
    response = client.post("/table/sounds", json={"name": name})

    assert response.status_code == 204
    assert response.content == b""


@pytest.mark.parametrize("body", [{"name": "explosion"}, {"name": "Heal"}, {"name": None}, {}])
def test_sound_rejects_unknown_names(client: TestClient, body: dict[str, Any]) -> None:
    response = client.post("/table/sounds", json=body)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "name"]
