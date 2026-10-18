from typing import Any

from fastapi import APIRouter, BackgroundTasks, status

from app.realtime import push
from app.realtime.audio import audio
from app.schemas import AudioState, AudioUpdate, SoundRequest

router = APIRouter()

UPDATE_RESPONSES: dict[int | str, dict[str, Any]] = {422: {"description": "Volume out of range, or validation error"}}
SOUND_RESPONSES: dict[int | str, dict[str, Any]] = {422: {"description": "Unknown sound, or validation error"}}


@router.get("/audio")
async def read_audio() -> AudioState:
    return audio.state()


@router.patch("/audio", responses=UPDATE_RESPONSES)
async def update_audio(update: AudioUpdate, background_tasks: BackgroundTasks) -> AudioState:
    """Works without an audio output as well: the Wall that becomes the output starts with the stored state."""
    state = await push.update_audio(update)
    background_tasks.add_task(push.push_audio)
    return state


@router.post("/sounds", status_code=status.HTTP_204_NO_CONTENT, responses=SOUND_RESPONSES)
async def play_sound(sound: SoundRequest, background_tasks: BackgroundTasks) -> None:
    """Plays the sound effect on the audio output; without an output it is dropped (204 anyway)."""
    background_tasks.add_task(push.send_sound, sound.name)
