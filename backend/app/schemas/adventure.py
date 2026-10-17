from pydantic import BaseModel, ConfigDict, Field
from pydantic.config import JsonDict

from app.schemas.scene import Image

MIN_LEVEL = 1
MAX_LEVEL = 20


class AdventureSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class Player(BaseModel):
    """A person with their character in one adventure (another adventure has its own entry for the same person)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    player_name: str
    character_name: str
    race: str
    character_class: str
    avatar: Image | None


class AdventureDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    global_level: int
    active_scene_id: int | None
    players: list[Player]


def _without_default(schema: JsonDict) -> None:
    # The default only makes the field optional; it is never applied (unset fields are not changed). Without it the
    # contract shows an optional, non-nullable field (generated frontend type `global_level?: number`).
    schema.pop("default", None)


class AdventureUpdate(BaseModel):
    """Partial update: only the fields set in the request are changed (`active_scene_id: null` clears it)."""

    active_scene_id: int | None = None
    global_level: int = Field(default=MIN_LEVEL, ge=MIN_LEVEL, le=MAX_LEVEL, json_schema_extra=_without_default)
