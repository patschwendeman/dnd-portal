"""Tests for the WebSocket /ws: snapshot on connect, push after PATCH /table and PATCH /adventures/{id}, screen and
origin checks, heartbeat and removal of broken connections; audio output of the Walls (audio_ready, track_ended,
audio_output, sound); number of connected screens for the Admins (screens).

Changing tests use the fixture `db` (tests/conftest.py), which also serves the push. A client always reads its initial
snapshot before the test continues, so the shared test session is never used by two threads at once.
"""

import asyncio
import json
from typing import Any

import anyio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from starlette.testclient import WebSocketTestSession
from starlette.websockets import WebSocketDisconnect

pytestmark = pytest.mark.usefixtures("reset_audio")

STATE_FIELDS = {"active_adventure_id", "active_scene_id", "theme"}
AUDIO_FIELDS = {"playing", "track", "volume", "output_ready"}
POLICY_VIOLATION = 1008
CONFIGURED_ORIGIN = "http://localhost:5173"
FOREIGN_ORIGIN = "http://evil.example"
RECEIVE_TIMEOUT_SECONDS = 2.0


def receive_any(websocket: WebSocketTestSession) -> Any:
    """Like `websocket.receive_json()`, but fails after a timeout instead of blocking forever when nothing is sent."""

    async def receive() -> Any:
        with anyio.fail_after(RECEIVE_TIMEOUT_SECONDS):
            # The test session has no public receive with timeout; _send_rx is the stream it reads from.
            return await websocket._send_rx.receive()

    message = websocket.portal.call(receive)
    assert message["type"] == "websocket.send", message
    return json.loads(message["text"])


def receive_json(websocket: WebSocketTestSession) -> Any:
    """The next message except `screens`: Admins receive it whenever a screen connects or disconnects, which the tests
    of state and audio do not care about. The `screens` tests read with `receive_any`.
    """
    message = receive_any(websocket)
    while message["type"] == "screens":
        message = receive_any(websocket)
    return message


def receive_state(websocket: WebSocketTestSession) -> dict[str, Any]:
    message = receive_json(websocket)
    assert message["type"] == "state"
    assert set(message) == {"type", "payload"}
    payload: dict[str, Any] = message["payload"]
    return payload


def receive_audio(websocket: WebSocketTestSession) -> dict[str, Any]:
    message = receive_json(websocket)
    assert message["type"] == "audio"
    assert set(message) == {"type", "payload"}
    payload: dict[str, Any] = message["payload"]
    assert set(payload) == AUDIO_FIELDS
    return payload


def receive_snapshot(websocket: WebSocketTestSession) -> dict[str, Any]:
    """The messages after connecting: the state, then the audio state; returns the state."""
    state = receive_state(websocket)
    receive_audio(websocket)
    return state


def receive_output(websocket: WebSocketTestSession) -> bool:
    message = receive_json(websocket)
    assert message["type"] == "audio_output", message
    assert set(message["payload"]) == {"active"}
    active: bool = message["payload"]["active"]
    return active


def become_output(wall: WebSocketTestSession) -> dict[str, Any]:
    """Sends audio_ready; returns the audio state pushed afterwards."""
    wall.send_json({"type": "audio_ready"})
    assert receive_output(wall) is True
    return receive_audio(wall)


def test_connect_sends_the_current_state(client: TestClient) -> None:
    expected = client.get("/table").json()
    expected_audio = client.get("/table/audio").json()

    with client.websocket_connect("/ws?screen=wall") as websocket:
        state = receive_state(websocket)
        audio = receive_audio(websocket)

    assert set(state) == STATE_FIELDS
    assert state == expected
    assert audio == expected_audio


@pytest.mark.parametrize("screen", ["admin", "wall", "ground", "player"])
def test_all_screens_are_accepted(client: TestClient, screen: str) -> None:
    with client.websocket_connect(f"/ws?screen={screen}") as websocket:
        assert set(receive_snapshot(websocket)) == STATE_FIELDS


@pytest.mark.parametrize("query", ["", "?screen=", "?screen=beamer", "?screen=Wall"])
def test_missing_or_unknown_screen_is_rejected(client: TestClient, query: str) -> None:
    with pytest.raises(WebSocketDisconnect) as error, client.websocket_connect(f"/ws{query}"):
        pass

    assert error.value.code == POLICY_VIOLATION


def test_two_clients_receive_the_push_after_patch_table(client: TestClient, db: Session) -> None:
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=wall") as wall,
    ):
        receive_snapshot(admin)
        receive_snapshot(wall)

        response = client.patch("/table", json={"theme": "tavern"})

        assert response.status_code == 200
        assert receive_state(admin) == response.json()
        assert receive_state(wall) == response.json()
        assert response.json()["theme"] == "tavern"


def test_player_receives_the_push_after_patch_table(client: TestClient, db: Session) -> None:
    with client.websocket_connect("/ws?screen=player") as player:
        receive_snapshot(player)

        client.patch("/table", json={"theme": "tavern"})

        assert receive_state(player)["theme"] == "tavern"


def test_two_clients_receive_the_push_after_patch_adventure(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    with (
        client.websocket_connect("/ws?screen=wall") as wall,
        client.websocket_connect("/ws?screen=ground") as ground,
    ):
        receive_snapshot(wall)
        receive_snapshot(ground)

        client.patch("/adventures/1", json={"active_scene_id": 5})

        expected = {"active_adventure_id": 1, "active_scene_id": 5, "theme": "dark"}
        assert receive_state(wall) == expected
        assert receive_state(ground) == expected


def test_patch_of_inactive_adventure_also_pushes(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    with client.websocket_connect("/ws?screen=wall") as wall:
        before = receive_snapshot(wall)

        client.patch(
            f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["first_scene_id"]}
        )

        assert receive_state(wall) == before


def test_switching_the_adventure_pushes_its_stored_scene(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})
    client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["first_scene_id"]})
    with client.websocket_connect("/ws?screen=wall") as wall:
        assert receive_snapshot(wall)["active_scene_id"] == 5

        client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

        # Directly the stored scene of the new adventure, without an intermediate state.
        assert receive_state(wall) == {
            "active_adventure_id": other_adventure["id"],
            "active_scene_id": other_adventure["first_scene_id"],
            "theme": "dark",
        }


def test_failed_patch_does_not_push(client: TestClient, db: Session) -> None:
    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_snapshot(wall)

        assert client.patch("/table", json={"theme": "light"}).status_code == 422
        assert client.patch("/table", json={"active_adventure_id": 99999}).status_code == 422
        assert client.patch("/adventures/1", json={"active_scene_id": 99999}).status_code == 422
        client.patch("/table", json={"theme": "tavern"})

        # The first message after the failed writes is the push of the successful one.
        assert receive_state(wall)["theme"] == "tavern"


@pytest.mark.parametrize(
    ("origin", "accepted"),
    [
        (FOREIGN_ORIGIN, False),
        ("http://testserver.evil.example", False),
        ("http://testserver:8080", False),
        ("http://testserver", True),
        ("http://TESTSERVER:80", True),
        (CONFIGURED_ORIGIN, True),
        (None, True),
    ],
)
def test_origin_check(client: TestClient, origin: str | None, accepted: bool) -> None:
    from app.core.config import settings

    if CONFIGURED_ORIGIN not in settings.cors_origins:
        pytest.skip("CORS_ORIGINS overrides the default origins this test relies on")
    headers = {"origin": origin} if origin is not None else {}

    if accepted:
        with client.websocket_connect("/ws?screen=wall", headers=headers) as websocket:
            assert set(receive_snapshot(websocket)) == STATE_FIELDS
    else:
        with pytest.raises(WebSocketDisconnect) as error, client.websocket_connect("/ws?screen=wall", headers=headers):
            pass
        assert error.value.code == POLICY_VIOLATION


def test_ping_is_sent_periodically(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.realtime import manager

    monkeypatch.setattr(manager, "PING_INTERVAL_SECONDS", 0.05)

    with client.websocket_connect("/ws?screen=ground") as websocket:
        receive_snapshot(websocket)

        assert receive_json(websocket) == {"type": "ping"}
        assert receive_json(websocket) == {"type": "ping"}


def test_closed_client_is_removed_and_others_still_receive(client: TestClient, db: Session) -> None:
    from app.realtime.manager import manager

    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_snapshot(wall)
        with client.websocket_connect("/ws?screen=ground") as ground:
            receive_snapshot(ground)
            assert len(manager.connections) == 2

        response = client.patch("/table", json={"theme": "tavern"})

        assert response.status_code == 200
        assert receive_state(wall)["theme"] == "tavern"
        assert [connection.screen for connection in manager.connections] == ["wall"]
    client.get("/table")  # lets the server finish the disconnect of the last client
    assert manager.connections == set()


class BrokenWebSocket:
    async def send_json(self, _message: dict[str, Any]) -> None:
        raise RuntimeError("connection lost")


class RecordingWebSocket:
    def __init__(self) -> None:
        self.messages: list[dict[str, Any]] = []

    async def send_json(self, message: dict[str, Any]) -> None:
        self.messages.append(message)


def test_broadcast_removes_connection_with_failing_send() -> None:
    from app.realtime.manager import Connection, ConnectionManager

    async def scenario() -> tuple[ConnectionManager, RecordingWebSocket]:
        connections = ConnectionManager()
        healthy = RecordingWebSocket()
        connections.add(Connection(websocket=BrokenWebSocket(), screen="wall"))  # type: ignore[arg-type]
        connections.add(Connection(websocket=healthy, screen="ground"))  # type: ignore[arg-type]

        await connections.broadcast({"type": "ping"})
        await connections.broadcast({"type": "ping"})
        return connections, healthy

    connections, healthy = asyncio.run(scenario())

    assert [connection.screen for connection in connections.connections] == ["ground"]
    assert healthy.messages == [{"type": "ping"}, {"type": "ping"}]


def test_audio_ready_of_a_wall_makes_it_the_output(client: TestClient) -> None:
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=wall") as wall,
    ):
        assert receive_snapshot(admin) and receive_snapshot(wall)

        audio = become_output(wall)

        assert audio["output_ready"] is True
        assert receive_audio(admin) == audio
        assert client.get("/table/audio").json() == audio


def test_second_wall_takes_over_the_output(client: TestClient) -> None:
    with (
        client.websocket_connect("/ws?screen=wall") as first,
        client.websocket_connect("/ws?screen=wall") as second,
    ):
        receive_snapshot(first)
        receive_snapshot(second)
        become_output(first)
        receive_audio(second)

        second.send_json({"type": "audio_ready"})

        assert receive_output(first) is False
        assert receive_output(second) is True
        assert receive_audio(first)["output_ready"] is True
        assert receive_audio(second)["output_ready"] is True


@pytest.mark.parametrize("screen", ["admin", "ground", "player"])
def test_audio_ready_of_other_screens_is_ignored(client: TestClient, screen: str) -> None:
    from app.realtime.audio import audio

    with (
        client.websocket_connect(f"/ws?screen={screen}") as other,
        client.websocket_connect("/ws?screen=wall") as wall,
    ):
        receive_snapshot(other)
        receive_snapshot(wall)

        other.send_json({"type": "audio_ready"})
        become_output(wall)

        # Had the other screen become the output, it would have received audio_output (active or not) first.
        assert receive_audio(other)["output_ready"] is True
        assert audio.output is not None
        assert audio.output.screen == "wall"


def test_track_ended_of_the_output_plays_the_next_track(
    client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.realtime.audio import audio

    monkeypatch.setattr(audio, "random", lambda: 0.0)
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=wall") as wall,
    ):
        receive_snapshot(admin)
        receive_snapshot(wall)
        first = become_output(wall)["track"]
        receive_audio(admin)

        wall.send_json({"type": "track_ended", "payload": {"track_id": first["id"]}})

        second = receive_audio(wall)["track"]
        assert second is not None
        assert second["id"] != first["id"]
        assert receive_audio(admin)["track"] == second

        # Outdated (the first track) or invalid reports are ignored; the next message is the one of audio_ready.
        wall.send_json({"type": "track_ended", "payload": {"track_id": first["id"]}})
        wall.send_json({"type": "track_ended", "payload": {"track_id": str(second["id"])}})
        wall.send_json({"type": "track_ended", "payload": {"track_id": True}})
        wall.send_json({"type": "track_ended"})
        assert become_output(wall)["track"] == second


def test_track_ended_of_a_wall_that_is_not_the_output_is_ignored(client: TestClient) -> None:
    with (
        client.websocket_connect("/ws?screen=wall") as output,
        client.websocket_connect("/ws?screen=wall") as other,
    ):
        receive_snapshot(output)
        receive_snapshot(other)
        track = become_output(output)["track"]
        receive_audio(other)

        other.send_json({"type": "track_ended", "payload": {"track_id": track["id"]}})
        other.send_json({"type": "audio_ready"})

        # Without a new track first: the next messages are those of audio_ready.
        assert receive_output(output) is False
        assert receive_audio(output)["track"] == track
        assert receive_output(other) is True
        assert receive_audio(other)["track"] == track


def test_sound_is_sent_only_to_the_output(client: TestClient) -> None:
    with (
        client.websocket_connect("/ws?screen=admin") as admin,
        client.websocket_connect("/ws?screen=wall") as output,
        client.websocket_connect("/ws?screen=wall") as other,
    ):
        for websocket in (admin, output, other):
            receive_snapshot(websocket)
        become_output(output)
        receive_audio(admin)
        receive_audio(other)

        assert client.post("/table/sounds", json={"name": "heal"}).status_code == 204
        client.patch("/table/audio", json={"volume": 40})

        assert receive_json(output) == {"type": "sound", "payload": {"name": "heal"}}
        assert receive_audio(output)["volume"] == 40
        # The first message after the sound is the push of the volume
        assert receive_audio(admin)["volume"] == 40
        assert receive_audio(other)["volume"] == 40


def test_disconnect_of_the_output_is_pushed_to_all(client: TestClient) -> None:
    with client.websocket_connect("/ws?screen=admin") as admin:
        receive_snapshot(admin)
        with client.websocket_connect("/ws?screen=wall") as wall:
            receive_snapshot(wall)
            become_output(wall)
            assert receive_audio(admin)["output_ready"] is True

        assert receive_audio(admin)["output_ready"] is False
    assert client.get("/table/audio").json()["output_ready"] is False


def test_disconnect_of_another_wall_keeps_the_output(client: TestClient) -> None:
    with client.websocket_connect("/ws?screen=wall") as output:
        receive_snapshot(output)
        become_output(output)
        with client.websocket_connect("/ws?screen=wall") as other:
            receive_snapshot(other)

        client.patch("/table/audio", json={"volume": 20})

        assert receive_audio(output) == {**client.get("/table/audio").json(), "output_ready": True}


@pytest.mark.parametrize("text", ["not json", "[1, 2]", '"audio_ready"', "{}", '{"type": "unknown"}', "null"])
def test_invalid_messages_do_not_break_the_connection(client: TestClient, text: str) -> None:
    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_snapshot(wall)

        wall.send_text(text)
        wall.send_bytes(b"\x00")

        assert become_output(wall)["output_ready"] is True


def receive_screens(websocket: WebSocketTestSession) -> dict[str, int]:
    message = receive_any(websocket)
    assert message["type"] == "screens", message
    assert set(message) == {"type", "payload"}
    payload: dict[str, int] = message["payload"]
    assert set(payload) == {"wall", "ground", "player"}
    return payload


def test_admin_receives_the_counts_after_the_snapshot(client: TestClient) -> None:
    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_snapshot(wall)
        with client.websocket_connect("/ws?screen=admin") as admin:
            assert receive_state(admin)
            assert receive_audio(admin)
            assert receive_screens(admin) == {"wall": 1, "ground": 0, "player": 0}


@pytest.mark.parametrize("screen", ["wall", "ground", "player"])
def test_connect_and_disconnect_of_a_screen_is_pushed_to_admins(client: TestClient, screen: str) -> None:
    zero = {"wall": 0, "ground": 0, "player": 0}
    with (
        client.websocket_connect("/ws?screen=admin") as first,
        client.websocket_connect("/ws?screen=admin") as second,
    ):
        receive_snapshot(first)
        assert receive_screens(first) == zero
        receive_snapshot(second)
        assert receive_screens(second) == zero

        with client.websocket_connect(f"/ws?screen={screen}") as other:
            receive_snapshot(other)
            assert receive_screens(first) == {**zero, screen: 1}
            assert receive_screens(second) == {**zero, screen: 1}
            with client.websocket_connect(f"/ws?screen={screen}") as another:
                receive_snapshot(another)
                assert receive_screens(first) == {**zero, screen: 2}
                assert receive_screens(second) == {**zero, screen: 2}

            assert receive_screens(first) == {**zero, screen: 1}
            assert receive_screens(second) == {**zero, screen: 1}

        assert receive_screens(first) == zero
        assert receive_screens(second) == zero


def test_admins_are_not_counted(client: TestClient, db: Session) -> None:
    with client.websocket_connect("/ws?screen=admin") as admin:
        receive_snapshot(admin)
        assert receive_screens(admin) == {"wall": 0, "ground": 0, "player": 0}
        with client.websocket_connect("/ws?screen=admin") as other:
            receive_snapshot(other)
            assert receive_screens(other) == {"wall": 0, "ground": 0, "player": 0}

        client.patch("/table", json={"theme": "tavern"})

        # Neither the connect nor the disconnect of the second Admin was pushed: the next message is the state.
        assert receive_any(admin)["type"] == "state"


@pytest.mark.parametrize("screen", ["wall", "ground", "player"])
def test_other_screens_do_not_receive_the_counts(client: TestClient, db: Session, screen: str) -> None:
    with client.websocket_connect(f"/ws?screen={screen}") as websocket:
        receive_snapshot(websocket)
        with client.websocket_connect("/ws?screen=wall") as wall:
            receive_snapshot(wall)

        client.patch("/table", json={"theme": "tavern"})

        # The connect and disconnect of the Wall changed the counts; still the next message is the state.
        assert receive_any(websocket)["type"] == "state"


def test_failed_send_to_a_screen_is_pushed_to_admins() -> None:
    from app.realtime.manager import Connection, ConnectionManager

    async def scenario() -> list[dict[str, Any]]:
        connections = ConnectionManager()
        admin = RecordingWebSocket()
        connections.add(Connection(websocket=admin, screen="admin"))  # type: ignore[arg-type]
        connections.add(Connection(websocket=BrokenWebSocket(), screen="ground"))  # type: ignore[arg-type]
        await connections.push_screens()

        await connections.broadcast({"type": "ping"})
        return admin.messages

    messages = asyncio.run(scenario())

    screens = [message["payload"] for message in messages if message["type"] == "screens"]
    assert screens == [{"wall": 0, "ground": 1, "player": 0}, {"wall": 0, "ground": 0, "player": 0}]
