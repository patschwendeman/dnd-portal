from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Adventure, Player


def read_adventures(db: Session) -> list[Adventure]:
    return list(db.scalars(select(Adventure).order_by(Adventure.id)))


def read_adventure(db: Session, adventure_id: int) -> Adventure | None:
    statement = (
        select(Adventure)
        .options(selectinload(Adventure.players).joinedload(Player.avatar))
        .where(Adventure.id == adventure_id)
    )
    return db.scalars(statement).one_or_none()


def update_adventure(db: Session, adventure: Adventure, values: dict[str, Any]) -> None:
    for field, value in values.items():
        setattr(adventure, field, value)
    db.commit()


def adventure_exists(db: Session, adventure_id: int) -> bool:
    return db.scalar(select(Adventure.id).where(Adventure.id == adventure_id)) is not None
