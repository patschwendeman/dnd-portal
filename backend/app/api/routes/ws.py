import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, status

from app.core.config import settings
from app.realtime import manager as realtime
from app.realtime.manager import SCREENS, Connection, manager
from app.realtime.origin import is_origin_allowed
from app.realtime.push import make_audio_output, release_audio_output, report_track_ended, send_initial_state

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


async def _handle_message(connection: Connection, text: str) -> None:
    """Only Walls send messages (they play the audio); anything else is ignored."""
    message = _parse(text)
    if message is None or connection.screen != "wall":
        return
    if message.get("type") == "audio_ready":
        await make_audio_output(connection)
    elif message.get("type") == "track_ended":
        payload = message.get("payload")
        track_id = payload.get("track_id") if isinstance(payload, dict) else None
        # bool is a subclass of int, but no track ID
        if isinstance(track_id, int) and not isinstance(track_id, bool):
            await report_track_ended(connection, track_id)


@router.websocket("")
async def game_table_socket(websocket: WebSocket, screen: str | None = None) -> None:
    """Pushes the game table state (`{"type": "state", "payload": GameTableState}`), the audio state
    (`{"type": "audio", "payload": AudioState}`) and `{"type": "ping"}`; to Walls also `audio_output` and `sound`.

    Walls send `audio_ready` and `track_ended`; other messages are ignored (see docs/architecture.md).
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
        # Shielded: also when the handler is cancelled (e.g. on shutdown), the others learn that the output is gone.
        await asyncio.shield(release_audio_output(connection))
