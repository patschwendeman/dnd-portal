from sqlalchemy import asc
from sqlalchemy.orm import Session, joinedload

from app.models import Scene


def read_scenes(db: Session) -> list[Scene]:
    return db.query(Scene).order_by(asc(Scene.id)).all()


def read_scene(db: Session, scene_id: int) -> Scene | None:
    return db.query(Scene).filter(Scene.id == scene_id).first()


def read_scenes_with_relations(db: Session) -> list[Scene]:
    query = db.query(Scene).options(
        joinedload(Scene.graphics_wall), joinedload(Scene.graphics_ground), joinedload(Scene.music)
    )
    return query.order_by(asc(Scene.id)).all()
