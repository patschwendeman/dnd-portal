from sqlalchemy import Select, select
from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models import Media, Scene


def _select_scenes_with_relations() -> Select[Scene]:
    # Tracks are joined explicitly (instead of joinedload) so that they can be ordered by ID.
    return (
        select(Scene)
        .outerjoin(Scene.tracks)
        .options(joinedload(Scene.wall_image), joinedload(Scene.ground_image), contains_eager(Scene.tracks))
        .order_by(Scene.id, Media.id)
    )


def read_scenes(db: Session, adventure_id: int | None = None) -> list[Scene]:
    """All scenes, or only those of one adventure."""
    statement = _select_scenes_with_relations()
    if adventure_id is not None:
        statement = statement.where(Scene.adventure_id == adventure_id)
    return list(db.scalars(statement).unique())


def read_scene(db: Session, scene_id: int) -> Scene | None:
    statement = _select_scenes_with_relations().where(Scene.id == scene_id)
    return db.scalars(statement).unique().one_or_none()


def read_scenes_by_main(db: Session, main: bool, adventure_id: int | None = None) -> list[Scene]:
    """Kampf- (main) or Nicht-Kampfszenen, of all adventures or only of one."""
    statement = (
        select(Scene)
        .options(joinedload(Scene.wall_image), joinedload(Scene.ground_image))
        .where(Scene.main == main)
        .order_by(Scene.id)
    )
    if adventure_id is not None:
        statement = statement.where(Scene.adventure_id == adventure_id)
    return list(db.scalars(statement))


def read_scene_adventure_id(db: Session, scene_id: int) -> int | None:
    """ID of the adventure the scene belongs to, `None` for an unknown scene."""
    return db.scalar(select(Scene.adventure_id).where(Scene.id == scene_id))
