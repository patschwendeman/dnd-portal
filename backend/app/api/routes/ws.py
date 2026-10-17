import asyncio

from fastapi import APIRouter, WebSocket, status

from app.core.config import settings
from app.realtime import manager as realtime
from app.realtime.manager import SCREENS, Connection, manager
from app.realtime.origin import is_origin_allowed
from app.realtime.push import send_initial_state

router = APIRouter()


async def _heartbeat(connection: Connection) -> None:
    while True:
        await asyncio.sleep(realtime.PING_INTERVAL_SECONDS)
        if not await manager.send(connection, realtime.PING_MESSAGE):
            return


@router.websocket("")
async def game_table_socket(websocket: WebSocket, screen: str | None = None) -> None:
    """Pushes the game table state (`{"type": "state", "payload": GameTableState}`) and `{"type": "ping"}`.

    Messages from the client are ignored; they are only read to notice the disconnect.
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
        while (await websocket.receive())["type"] != "websocket.disconnect":
            pass
    finally:
        if heartbeat is not None:
            heartbeat.cancel()
        manager.remove(connection)
