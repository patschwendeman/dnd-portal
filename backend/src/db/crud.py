from typing import Type, TypeVar, Optional, Dict, Any
from sqlalchemy.orm import Session

T = TypeVar('T')

def read_all(db: Session, model: Type[T]) -> Optional[T]:
    return db.query(model).all()

def read_by_id(db: Session, model: Type[T], model_id: int) -> Optional[T]:
    return db.query(model).filter(model.id == model_id).first()

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
