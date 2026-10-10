from typing import TypeVar

from sqlalchemy import asc
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.query import Query

from app.db.models import Scene

T = TypeVar("T")


def read_all(db: Session, model: type[T]) -> list[T]:
    query: Query = db.query(model)
    elements_ordered = query.order_by(asc(model.id)).all()  # type: ignore[attr-defined]
    return elements_ordered


def read_by_id(db: Session, model: type[T], model_id: int) -> T | None:
    return db.query(model).filter(model.id == model_id).first()  # type: ignore[attr-defined]


def read_join_all(db: Session) -> list[Scene]:
    query: Query = db.query(Scene).options(
        joinedload(Scene.graphics_wall), joinedload(Scene.graphics_ground), joinedload(Scene.music)
    )
    scenes = query.order_by(asc(Scene.id)).all()
    return scenes
