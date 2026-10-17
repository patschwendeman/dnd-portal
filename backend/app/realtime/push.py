from typing import Any

from starlette.concurrency import run_in_threadpool

from app.db.session import SessionLocal
from app.realtime.manager import Connection, manager
from app.schemas import GameTableState
from app.services import game_table as game_table_service


def _read_state() -> GameTableState:
    # Own session: the push runs after the response, independent of the session of the request.
    with SessionLocal() as db:
        return game_table_service.get_state(db)


def state_message(state: GameTableState) -> dict[str, Any]:
    return {"type": "state", "payload": state.model_dump(mode="json")}


async def push_state() -> None:
    """Sends the current state to all connected screens (background task of the write routes, after the commit)."""
    async with manager.state_lock:
        state = await run_in_threadpool(_read_state)
        await manager.broadcast(state_message(state))


async def send_initial_state(connection: Connection) -> bool:
    """Registers the connection and sends it the current state; False if the send failed."""
    async with manager.state_lock:
        manager.add(connection)
        state = await run_in_threadpool(_read_state)
        return await manager.send(connection, state_message(state))
