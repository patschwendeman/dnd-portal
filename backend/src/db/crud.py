from sqlalchemy.orm import Session
from typing import Type, TypeVar, Optional, Dict, Any

T = TypeVar('T')

def read_all(db: Session, model: Type[T]) -> Optional[T]:
    return db.query(model).all()

def read_by_id(db: Session, model: Type[T], id: int) -> Optional[T]:
    return db.query(model).filter(model.id == id).first()

def create(db: Session, model: Type[T], data: Dict[str, Any]) -> T:
    instance = model(**data)
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance

# update
# delete