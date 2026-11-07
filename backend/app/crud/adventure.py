from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Adventure, Player

_PLAYERS_AND_IMAGE = (
    selectinload(Adventure.players).joinedload(Player.avatar),
    joinedload(Adventure.image),
)


def read_adventures(db: Session) -> list[Adventure]:
    statement = select(Adventure).options(*_PLAYERS_AND_IMAGE).order_by(Adventure.id)
    return list(db.scalars(statement))


def read_adventure(db: Session, adventure_id: int) -> Adventure | None:
    statement = select(Adventure).options(*_PLAYERS_AND_IMAGE).where(Adventure.id == adventure_id)
    return db.scalars(statement).one_or_none()


def update_adventure(db: Session, adventure: Adventure, values: dict[str, Any]) -> None:
    for field, value in values.items():
        setattr(adventure, field, value)
    db.commit()


def adventure_exists(db: Session, adventure_id: int) -> bool:
    return db.scalar(select(Adventure.id).where(Adventure.id == adventure_id)) is not None
