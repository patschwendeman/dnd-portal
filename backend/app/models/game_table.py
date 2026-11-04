from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.adventure import Adventure

# One server is one game table: the table holds exactly one row with this ID (created by migration 0004).
GAME_TABLE_ID = 1


class GameTable(Base):
    """State of the game table shared by Admin, Wall and Ground; the active scene stays in `adventure`."""

    __tablename__ = "game_table"
    __table_args__ = (
        CheckConstraint(f"id = {GAME_TABLE_ID}", name="single_row"),
        CheckConstraint("theme IN ('dark', 'tavern')", name="theme"),
        CheckConstraint(
            "ground_grid_cell_size BETWEEN 100 AND 200 AND ground_grid_cell_size % 10 = 0",
            name="ground_grid_cell_size",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    active_adventure_id: Mapped[int | None] = mapped_column(ForeignKey("adventure.id", ondelete="SET NULL"))
    theme: Mapped[str] = mapped_column(Text, default="dark", server_default="dark")
    ground_grid_cell_size: Mapped[int] = mapped_column(default=100, server_default="100")
    active_adventure: Mapped["Adventure | None"] = relationship()
