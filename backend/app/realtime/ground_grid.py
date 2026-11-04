from app.schemas.game_table import DEFAULT_GROUND_GRID, GroundGrid


class GroundGridState:
    """Line colour of the Ground grid (`off`: no grid), kept in memory of the API process like the Wall overlay.

    Not stored in the database: after a restart no grid (`off`) is the sensible start state. The cell size is stored
    in `game_table`, since it is set once for the Ground monitor and the figures.
    """

    def __init__(self) -> None:
        self.color: GroundGrid = DEFAULT_GROUND_GRID

    def reset(self) -> None:
        self.color = DEFAULT_GROUND_GRID


ground_grid = GroundGridState()
