import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, status

from app.core.config import settings
from app.realtime import manager as realtime
from app.realtime.manager import FULLSCREEN_SCREENS, SCREENS, Connection, manager
from app.realtime.origin import is_origin_allowed
from app.realtime.push import make_audio_output, release_connection, report_track_ended, send_initial_state

router = APIRouter()


async def _heartbeat(connection: Connection) -> None:
    while True:
        await asyncio.sleep(realtime.PING_INTERVAL_SECONDS)
        if not await manager.send(connection, realtime.PING_MESSAGE):
            return


def _parse(text: str) -> dict[str, Any] | None:
    try:
        message = json.loads(text)
    except ValueError:
        return None
    return message if isinstance(message, dict) else None


def _payload(message: dict[str, Any]) -> dict[str, Any]:
    payload = message.get("payload")
    return payload if isinstance(payload, dict) else {}


async def _handle_message(connection: Connection, text: str) -> None:
    """Walls send audio messages, Walls and Grounds their full screen state, Admins full screen requests; anything
    else is ignored.
    """
    message = _parse(text)
    if message is None:
        return
    if connection.screen == "admin":
        await _handle_admin_message(message)
        return
    if connection.screen in FULLSCREEN_SCREENS:
        await _handle_fullscreen_message(connection, message)
    if connection.screen == "wall":
        await _handle_wall_message(connection, message)


async def _handle_admin_message(message: dict[str, Any]) -> None:
    """`fullscreen`: passed on to all Walls or all Grounds, which switch full screen on or off themselves."""
    if message.get("type") != "fullscreen":
        return
    payload = _payload(message)
    screen, active = payload.get("screen"), payload.get("active")
    for target in FULLSCREEN_SCREENS:
        if screen == target and isinstance(active, bool):
            await manager.send_to_screen(target, fullscreen_message(active))


async def _handle_fullscreen_message(connection: Connection, message: dict[str, Any]) -> None:
    if message.get("type") == "fullscreen_state":
        active = _payload(message).get("active")
        if isinstance(active, bool):
            await manager.set_fullscreen(connection, active)
    elif message.get("type") == "fullscreen_rejected":
        await manager.send_to_screen("admin", fullscreen_rejected_message(connection.screen))


async def _handle_wall_message(connection: Connection, message: dict[str, Any]) -> None:
    if message.get("type") == "audio_ready":
        await make_audio_output(connection)
    elif message.get("type") == "track_ended":
        track_id = _payload(message).get("track_id")
        # bool is a subclass of int, but no track ID
        if isinstance(track_id, int) and not isinstance(track_id, bool):
            await report_track_ended(connection, track_id)


def fullscreen_message(active: bool) -> dict[str, Any]:
    return {"type": "fullscreen", "payload": {"active": active}}


def fullscreen_rejected_message(screen: str) -> dict[str, Any]:
    return {"type": "fullscreen_rejected", "payload": {"screen": screen}}


@router.websocket("")
async def game_table_socket(websocket: WebSocket, screen: str | None = None) -> None:
    """Pushes the game table state (`{"type": "state", "payload": GameTableState}`), the audio state
    (`{"type": "audio", "payload": AudioState}`) and `{"type": "ping"}`; to Walls also `audio_output` and `sound`, to
    Walls and Grounds `fullscreen`, to Admins also the number of connected screens per type (`{"type": "screens",
    "payload": {"wall": n, "ground": n, "player": n, "fullscreen": {"wall": n, "ground": n}}}`) and
    `fullscreen_rejected`.

    Walls send `audio_ready` and `track_ended`, Walls and Grounds `fullscreen_state` and `fullscreen_rejected`, Admins
    `fullscreen`; other messages are ignored (see docs/architecture.md).
    """
    if not is_origin_allowed(websocket.headers.get("origin"), websocket.headers.get("host"), settings.cors_origins):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Origin not allowed")
        return
    if screen not in SCREENS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unknown screen")
        return

    await websocket.accept()
    connection = Connection(websocket=websocket, screen=screen)
    heartbeat: asyncio.Task[None] | None = None
    try:
        if not await send_initial_state(connection):
            return
        heartbeat = asyncio.create_task(_heartbeat(connection))
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            if message.get("text") is not None:
                await _handle_message(connection, message["text"])
    finally:
        if heartbeat is not None:
            heartbeat.cancel()
        manager.remove(connection)
        # Shielded: also when the handler is cancelled (e.g. on shutdown), the others learn that the output is gone and
        # the Admins that the screen is.
        await asyncio.shield(release_connection(connection))
