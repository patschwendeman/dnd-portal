from app.schemas.game_table import DEFAULT_GROUND_GRID, DEFAULT_GROUND_GRID_CELL_SIZE, GroundGrid


class GroundGridState:
    """Grid of the Grounds (part of the game table state), kept in memory of the API process like the Wall overlay.

    Not stored in the database: after a restart no grid (`off`, cell size 100) is the sensible start state.
    """

    def __init__(self) -> None:
        self.color: GroundGrid = DEFAULT_GROUND_GRID
        self.cell_size = DEFAULT_GROUND_GRID_CELL_SIZE

    def reset(self) -> None:
        self.color = DEFAULT_GROUND_GRID
        self.cell_size = DEFAULT_GROUND_GRID_CELL_SIZE


ground_grid = GroundGridState()
