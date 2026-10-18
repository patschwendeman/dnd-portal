from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.adventure import _without_default
from app.schemas.scene import Track

MIN_VOLUME = 0
MAX_VOLUME = 100
DEFAULT_VOLUME = 10

# The sound files stay in the frontend; the server only knows their names.
SoundName = Literal[
    "heal", "bottle", "buff", "music_1", "music_2", "spell_1", "spell_2", "debuff_1", "debuff_2", "lock"
]


class AudioState(BaseModel):
    """Music of the game table, played by the Wall that is the audio output (`output_ready`); volume in percent."""

    playing: bool
    track: Track | None
    volume: int
    output_ready: bool


class AudioUpdate(BaseModel):
    """Partial update: only the fields set in the request are changed."""

    playing: bool = Field(default=False, json_schema_extra=_without_default)
    volume: int = Field(default=DEFAULT_VOLUME, ge=MIN_VOLUME, le=MAX_VOLUME, json_schema_extra=_without_default)


class SoundRequest(BaseModel):
    name: SoundName
