import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Literal

from fastapi import WebSocket

Screen = Literal["admin", "wall", "ground", "player"]
SCREENS: tuple[Screen, ...] = ("admin", "wall", "ground", "player")
# Screens whose connections the Admins see in the dashboard; Admins themselves are not counted.
COUNTED_SCREENS: tuple[Screen, ...] = ("wall", "ground", "player")
# Screens the Admins can switch to full screen remotely.
FULLSCREEN_SCREENS: tuple[Screen, ...] = ("wall", "ground")

# Application-level heartbeat: lets the clients notice a silently broken connection (they reconnect after 35 s
# without any message). Read at runtime, so tests can shorten it.
PING_INTERVAL_SECONDS = 15.0
PING_MESSAGE: dict[str, Any] = {"type": "ping"}

# A send that does not finish in time counts as failed, so a stalled client cannot block the others.
SEND_TIMEOUT_SECONDS = 5.0

logger = logging.getLogger(__name__)


def screens_message(counts: dict[str, Any]) -> dict[str, Any]:
    return {"type": "screens", "payload": counts}


@dataclass(eq=False)
class Connection:
    websocket: WebSocket
    screen: Screen
    # Reported by the Wall or Ground itself (fullscreen_state); the Admins see how many are in full screen.
    fullscreen: bool = False
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
        # Counting and sending happen under this lock, so the Admins receive the counts in the order they changed.
        self.screens_lock = asyncio.Lock()
        # Counts last pushed to the Admins; a push is only sent when they differ.
        self.pushed_counts = self.screen_counts()

    def screen_counts(self) -> dict[str, Any]:
        """Number of open connections per screen type, without the Admins, and how many of them are in full screen."""
        counts: dict[str, Any] = {
            screen: sum(1 for c in self.connections if c.screen == screen) for screen in COUNTED_SCREENS
        }
        counts["fullscreen"] = {
            screen: sum(1 for c in self.connections if c.screen == screen and c.fullscreen)
            for screen in FULLSCREEN_SCREENS
        }
        return counts

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
            if connection.screen != "admin":
                await self.push_screens()
            return False
        return True

    async def send_screens(self, connection: Connection) -> bool:
        """Sends the current counts to one (new) Admin."""
        async with self.screens_lock:
            return await self.send(connection, screens_message(self.screen_counts()))

    async def push_screens(self) -> None:
        """Sends the counts to all Admins if they changed since the last push (connect, disconnect, failed send).

        Only Admins receive the message; a failed send to one of them does not change the counts, so this does not
        run again from inside.
        """
        async with self.screens_lock:
            counts = self.screen_counts()
            if counts == self.pushed_counts:
                return
            self.pushed_counts = counts
            await self.send_to_screen("admin", screens_message(counts))

    async def broadcast(self, message: dict[str, Any]) -> None:
        connections = list(self.connections)
        await asyncio.gather(*(self.send(connection, message) for connection in connections))

    async def send_to_screen(self, screen: Screen, message: dict[str, Any]) -> None:
        """Sends to all connections of one screen type (e.g. all Walls)."""
        connections = [connection for connection in self.connections if connection.screen == screen]
        await asyncio.gather(*(self.send(connection, message) for connection in connections))

    async def set_fullscreen(self, connection: Connection, active: bool) -> None:
        """Keeps the full screen state a Wall or Ground reported; the Admins receive the new counts."""
        connection.fullscreen = active
        await self.push_screens()


manager = ConnectionManager()
