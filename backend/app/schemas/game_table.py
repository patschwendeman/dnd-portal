from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.adventure import _without_default

Theme = Literal["dark", "tavern"]
DEFAULT_THEME: Theme = "dark"
WallOverlay = Literal["world", "off"]
DEFAULT_WALL_OVERLAY: WallOverlay = "off"


class GameTableState(BaseModel):
    """State of the game table shared by Admin, Wall and Ground; `active_scene_id` belongs to the active adventure.

    `wall_overlay` is what the Walls show above the scene image (`world`: the world map); it is kept in memory only and
    set to `off` whenever the active scene or adventure changes.
    """

    active_adventure_id: int | None
    active_scene_id: int | None
    theme: Theme
    wall_overlay: WallOverlay


class GameTableUpdate(BaseModel):
    """Partial update: only the fields set in the request are changed (`active_adventure_id: null` clears it)."""

    active_adventure_id: int | None = None
    theme: Theme = Field(default=DEFAULT_THEME, json_schema_extra=_without_default)
    wall_overlay: WallOverlay = Field(default=DEFAULT_WALL_OVERLAY, json_schema_extra=_without_default)


class JoinInfo(BaseModel):
    """How players join the game table: URL of the Player Screen in the LAN, `null` if unknown."""

    player_url: str | None
