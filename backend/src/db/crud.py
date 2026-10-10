from typing import List, Type, TypeVar, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.query import Query
from sqlalchemy import asc
from src.db.models import Scene

T = TypeVar('T')

def read_all(db: Session, model: Type[T]) -> List[T]:
    query: Query = db.query(model)
    elements_ordered = query.order_by(asc(model.id)).all()
    return elements_ordered

def read_by_id(db: Session, model: Type[T], model_id: int) -> Optional[T]:
    return db.query(model).filter(model.id == model_id).first()

def read_join_all(db: Session) -> List[Scene]:
    query: Query = db.query(Scene).options(
        joinedload(Scene.graphics_wall),
        joinedload(Scene.graphics_ground),
        joinedload(Scene.music)
    )
    scenes = query.order_by(asc(Scene.id)).all()
    return scenes
