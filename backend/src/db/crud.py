from dataclasses import dataclass
from typing import List, Type, TypeVar, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.query import Query
from sqlalchemy import asc
from src.db.models import Scene

T = TypeVar('T')

@dataclass
class Base:
    id = None

def read_all(db: Session, model: Type[Base]) -> List[Base]:
    query: Query = db.query(model)
    elements_ordered = query.order_by(asc(model.id)).all()
    return elements_ordered

def read_by_id(db: Session, model: Type[T], model_id: int) -> Optional[T]:
    return db.query(model).filter(model.id == model_id).first()

def read_join_all(db: Session) -> List[Scene]:
    query: Query = db.query(Scene).options(
        joinedload(Scene.graphics_wall),
        joinedload(Scene.graphics_ground),
        joinedload(Scene.battlemaps),
        joinedload(Scene.music)
    )
    scenes = query.order_by(asc(Scene.id)).all()
    return scenes

def create(db: Session, model: Type[T], data: Dict[str, Any]) -> T:
    instance = model(**data)
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance

def update(db: Session, model: Type[T], model_id: int, data: Dict[str, Any]) -> T:
    instance = db.query(model).filter(model.id == model_id).one()

    if instance is None:
        raise ValueError("Object not found")

    for key, value in data.items():
        if hasattr(instance, key):
            setattr(instance, key, value)
        else:
            raise ValueError(f"Attribute {key} does not exist on BattleMap")

    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance
