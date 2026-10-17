from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.adventure import _without_default

Theme = Literal["dark", "tavern"]
DEFAULT_THEME: Theme = "dark"


class GameTableState(BaseModel):
    """State of the game table shared by Admin, Wall and Ground; `active_scene_id` belongs to the active adventure."""

    active_adventure_id: int | None
    active_scene_id: int | None
    theme: Theme


class GameTableUpdate(BaseModel):
    """Partial update: only the fields set in the request are changed (`active_adventure_id: null` clears it)."""

    active_adventure_id: int | None = None
    theme: Theme = Field(default=DEFAULT_THEME, json_schema_extra=_without_default)
