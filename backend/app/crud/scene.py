from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models import Scene


def _select_scenes_with_relations() -> Select[Scene]:
    return select(Scene).options(
        joinedload(Scene.graphics_wall), joinedload(Scene.graphics_ground), joinedload(Scene.music)
    )


def read_scenes(db: Session) -> list[Scene]:
    return list(db.scalars(select(Scene).order_by(Scene.id)))


def read_scene(db: Session, scene_id: int) -> Scene | None:
    return db.get(Scene, scene_id)


def read_scenes_with_relations(db: Session) -> list[Scene]:
    statement = _select_scenes_with_relations().order_by(Scene.id)
    return list(db.scalars(statement).unique())


def read_scene_with_relations(db: Session, scene_id: int) -> Scene | None:
    statement = _select_scenes_with_relations().where(Scene.id == scene_id)
    return db.scalars(statement).unique().one_or_none()


def read_scenes_by_main(db: Session, main: bool) -> list[Scene]:
    statement = (
        select(Scene)
        .options(joinedload(Scene.graphics_wall), joinedload(Scene.graphics_ground))
        .where(Scene.main == main)
        .order_by(Scene.id)
    )
    return list(db.scalars(statement))
