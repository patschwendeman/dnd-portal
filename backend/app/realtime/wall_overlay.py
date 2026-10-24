from app.schemas.game_table import DEFAULT_WALL_OVERLAY, WallOverlay


class WallOverlayState:
    """Overlay of the Walls (part of the game table state), kept in memory of the API process like the music state.

    Not stored in the database: after a restart no overlay (`off`) is the sensible start state.
    """

    def __init__(self) -> None:
        self.value: WallOverlay = DEFAULT_WALL_OVERLAY

    def reset(self) -> None:
        self.value = DEFAULT_WALL_OVERLAY


wall_overlay = WallOverlayState()
