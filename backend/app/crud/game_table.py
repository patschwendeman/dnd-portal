from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import GameTable
from app.models.game_table import GAME_TABLE_ID


def read_game_table(db: Session) -> GameTable:
    """The single row created by migration 0004, with the active adventure (for its active scene)."""
    statement = select(GameTable).options(joinedload(GameTable.active_adventure)).where(GameTable.id == GAME_TABLE_ID)
    return db.scalars(statement).one()


def update_game_table(db: Session, game_table: GameTable, values: dict[str, Any]) -> None:
    for field, value in values.items():
        setattr(game_table, field, value)
    db.commit()
