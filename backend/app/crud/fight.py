from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Fight, Player


def read_fight(db: Session, adventure_id: int, *, for_update: bool = False) -> Fight | None:
    """The fight of the adventure with its combatants in initiative order.

    `for_update` locks the row until the commit, so that concurrent writes (e.g. a double click on "Zug beenden") see
    each other's result instead of both changing the same state.
    """
    statement = select(Fight).options(selectinload(Fight.combatants)).where(Fight.adventure_id == adventure_id)
    if for_update:
        statement = statement.with_for_update(of=Fight)
    return db.scalars(statement).one_or_none()


def fight_exists(db: Session, adventure_id: int) -> bool:
    return db.scalar(select(Fight.id).where(Fight.adventure_id == adventure_id)) is not None


def read_player_ids(db: Session, adventure_id: int) -> set[int]:
    return set(db.scalars(select(Player.id).where(Player.adventure_id == adventure_id)))


def create_fight(db: Session, fight: Fight) -> None:
    db.add(fight)
    db.flush()


def delete_fight(db: Session, fight: Fight) -> None:
    db.delete(fight)
    db.commit()
