import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Literal

from fastapi import WebSocket

Screen = Literal["admin", "wall", "ground", "player"]
SCREENS: tuple[Screen, ...] = ("admin", "wall", "ground", "player")

# Application-level heartbeat: lets the clients notice a silently broken connection (they reconnect after 35 s
# without any message). Read at runtime, so tests can shorten it.
PING_INTERVAL_SECONDS = 15.0
PING_MESSAGE: dict[str, Any] = {"type": "ping"}

# A send that does not finish in time counts as failed, so a stalled client cannot block the others.
SEND_TIMEOUT_SECONDS = 5.0

logger = logging.getLogger(__name__)


@dataclass(eq=False)
class Connection:
    websocket: WebSocket
    screen: Screen
    # Snapshot, broadcast and heartbeat may send at the same time; one message after the other per connection.
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def send(self, message: dict[str, Any]) -> None:
        async with self.lock:
            await asyncio.wait_for(self.websocket.send_json(message), SEND_TIMEOUT_SECONDS)


class ConnectionManager:
    """Open WebSocket connections of this API process (uvicorn runs with one worker)."""

    def __init__(self) -> None:
        self.connections: set[Connection] = set()
        # Reading the state and sending it happen under this lock, so every client receives the snapshots in the
        # order they were read (a slow initial snapshot cannot overtake a newer push).
        self.state_lock = asyncio.Lock()

    def add(self, connection: Connection) -> None:
        self.connections.add(connection)

    def remove(self, connection: Connection) -> None:
        self.connections.discard(connection)

    async def send(self, connection: Connection, message: dict[str, Any]) -> bool:
        """Sends to one connection; a failed send removes it (the client reconnects on its own)."""
        try:
            await connection.send(message)
        except Exception:
            logger.info("Removing %s connection after a failed send", connection.screen, exc_info=True)
            self.remove(connection)
            return False
        return True

    async def broadcast(self, message: dict[str, Any]) -> None:
        connections = list(self.connections)
        await asyncio.gather(*(self.send(connection, message) for connection in connections))


manager = ConnectionManager()
