from typing import Any

from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db.session import SessionLocal
from app.realtime.audio import audio
from app.realtime.manager import Connection, manager
from app.schemas import AudioState, AudioUpdate, GameTableState, SoundName, Track
from app.services import audio as audio_service
from app.services import game_table as game_table_service


def _read_state() -> GameTableState:
    # Own session: the push runs after the response, independent of the session of the request.
    with SessionLocal() as db:
        return game_table_service.get_state(db)


def _read_state_and_playlist(scene_id: int | None) -> tuple[GameTableState, list[Track] | None]:
    """The state and, if its active scene is not `scene_id` (the one the music belongs to), the new playlist."""
    with SessionLocal() as db:
        state = game_table_service.get_state(db)
        if state.active_scene_id == scene_id:
            return state, None
        return state, audio_service.get_playlist(db, state.active_scene_id)


def reset_audio(db: Session) -> None:
    scene_id = game_table_service.get_state(db).active_scene_id
    audio.reset(scene_id, audio_service.get_playlist(db, scene_id))


def state_message(state: GameTableState) -> dict[str, Any]:
    return {"type": "state", "payload": state.model_dump(mode="json")}


def audio_message() -> dict[str, Any]:
    return {"type": "audio", "payload": audio.state().model_dump(mode="json")}


def audio_output_message(active: bool) -> dict[str, Any]:
    return {"type": "audio_output", "payload": {"active": active}}


async def push_state() -> None:
    """Sends the current state to all connected screens (background task of the write routes, after the commit).

    If the active scene changed, the music switches to its playlist and the audio state is pushed as well.
    """
    async with manager.state_lock:
        state, playlist = await run_in_threadpool(_read_state_and_playlist, audio.scene_id)
        await manager.broadcast(state_message(state))
        if playlist is not None:
            audio.set_playlist(state.active_scene_id, playlist)
            await manager.broadcast(audio_message())


async def push_audio() -> None:
    async with manager.state_lock:
        await manager.broadcast(audio_message())


async def update_audio(update: AudioUpdate) -> AudioState:
    async with manager.state_lock:
        audio.update(update)
        return audio.state()


async def send_initial_state(connection: Connection) -> bool:
    """Registers the connection and sends it the current state and audio state, to an Admin also the connection
    counts; False if a send failed. A new Wall, Ground or Player changes the counts the Admins see.
    """
    async with manager.state_lock:
        manager.add(connection)
        state = await run_in_threadpool(_read_state)
        sent = await manager.send(connection, state_message(state)) and await manager.send(connection, audio_message())
        if connection.screen == "admin":
            return sent and await manager.send_screens(connection)
        await manager.push_screens()
        return sent


async def send_sound(name: SoundName) -> None:
    async with manager.state_lock:
        if audio.output is not None:
            await manager.send(audio.output, {"type": "sound", "payload": {"name": name}})


async def make_audio_output(connection: Connection) -> None:
    async with manager.state_lock:
        previous = audio.set_output(connection)
        if previous is not None:
            await manager.send(previous, audio_output_message(False))
        await manager.send(connection, audio_output_message(True))
        await manager.broadcast(audio_message())


async def report_track_ended(connection: Connection, track_id: int) -> None:
    async with manager.state_lock:
        if audio.track_ended(connection, track_id):
            await manager.broadcast(audio_message())


async def release_audio_output(connection: Connection) -> None:
    async with manager.state_lock:
        if audio.release_output(connection):
            await manager.broadcast(audio_message())


async def release_connection(connection: Connection) -> None:
    """After a disconnect (the connection is already removed): releases its audio output and pushes the new counts."""
    await release_audio_output(connection)
    await manager.push_screens()
