"""Tests for the WebSocket /ws: snapshot on connect, push after PATCH /table and PATCH /adventures/{id}, screen and
origin checks, heartbeat and removal of broken connections.

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

STATE_FIELDS = {"active_adventure_id", "active_scene_id", "theme"}
POLICY_VIOLATION = 1008
CONFIGURED_ORIGIN = "http://localhost:5173"
FOREIGN_ORIGIN = "http://evil.example"
RECEIVE_TIMEOUT_SECONDS = 2.0


def receive_json(websocket: WebSocketTestSession) -> Any:
    """Like `websocket.receive_json()`, but fails after a timeout instead of blocking forever when nothing is sent."""

    async def receive() -> Any:
        with anyio.fail_after(RECEIVE_TIMEOUT_SECONDS):
            # The test session has no public receive with timeout; _send_rx is the stream it reads from.
            return await websocket._send_rx.receive()

    message = websocket.portal.call(receive)
    assert message["type"] == "websocket.send", message
    return json.loads(message["text"])


def receive_state(websocket: WebSocketTestSession) -> dict[str, Any]:
    message = receive_json(websocket)
    assert message["type"] == "state"
    assert set(message) == {"type", "payload"}
    payload: dict[str, Any] = message["payload"]
    return payload


def test_connect_sends_the_current_state(client: TestClient) -> None:
    expected = client.get("/table").json()

    with client.websocket_connect("/ws?screen=wall") as websocket:
        state = receive_state(websocket)

    assert set(state) == STATE_FIELDS
    assert state == expected


@pytest.mark.parametrize("screen", ["admin", "wall", "ground", "player"])
def test_all_screens_are_accepted(client: TestClient, screen: str) -> None:
    with client.websocket_connect(f"/ws?screen={screen}") as websocket:
        assert set(receive_state(websocket)) == STATE_FIELDS


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
        receive_state(admin)
        receive_state(wall)

        response = client.patch("/table", json={"theme": "tavern"})

        assert response.status_code == 200
        assert receive_state(admin) == response.json()
        assert receive_state(wall) == response.json()
        assert response.json()["theme"] == "tavern"


def test_two_clients_receive_the_push_after_patch_adventure(client: TestClient, db: Session) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    with (
        client.websocket_connect("/ws?screen=wall") as wall,
        client.websocket_connect("/ws?screen=ground") as ground,
    ):
        receive_state(wall)
        receive_state(ground)

        client.patch("/adventures/1", json={"active_scene_id": 5})

        expected = {"active_adventure_id": 1, "active_scene_id": 5, "theme": "dark"}
        assert receive_state(wall) == expected
        assert receive_state(ground) == expected


def test_patch_of_inactive_adventure_also_pushes(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    with client.websocket_connect("/ws?screen=wall") as wall:
        before = receive_state(wall)

        client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["main_scene_id"]})

        assert receive_state(wall) == before


def test_switching_the_adventure_pushes_its_stored_scene(
    client: TestClient, db: Session, other_adventure: dict[str, int]
) -> None:
    client.patch("/table", json={"active_adventure_id": 1})
    client.patch("/adventures/1", json={"active_scene_id": 5})
    client.patch(f"/adventures/{other_adventure['id']}", json={"active_scene_id": other_adventure["main_scene_id"]})
    with client.websocket_connect("/ws?screen=wall") as wall:
        assert receive_state(wall)["active_scene_id"] == 5

        client.patch("/table", json={"active_adventure_id": other_adventure["id"]})

        # Directly the stored scene of the new adventure, without an intermediate state.
        assert receive_state(wall) == {
            "active_adventure_id": other_adventure["id"],
            "active_scene_id": other_adventure["main_scene_id"],
            "theme": "dark",
        }


def test_failed_patch_does_not_push(client: TestClient, db: Session) -> None:
    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_state(wall)

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
            assert set(receive_state(websocket)) == STATE_FIELDS
    else:
        with pytest.raises(WebSocketDisconnect) as error, client.websocket_connect("/ws?screen=wall", headers=headers):
            pass
        assert error.value.code == POLICY_VIOLATION


def test_ping_is_sent_periodically(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.realtime import manager

    monkeypatch.setattr(manager, "PING_INTERVAL_SECONDS", 0.05)

    with client.websocket_connect("/ws?screen=ground") as websocket:
        receive_state(websocket)

        assert receive_json(websocket) == {"type": "ping"}
        assert receive_json(websocket) == {"type": "ping"}


def test_closed_client_is_removed_and_others_still_receive(client: TestClient, db: Session) -> None:
    from app.realtime.manager import manager

    with client.websocket_connect("/ws?screen=wall") as wall:
        receive_state(wall)
        with client.websocket_connect("/ws?screen=ground") as ground:
            receive_state(ground)
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
