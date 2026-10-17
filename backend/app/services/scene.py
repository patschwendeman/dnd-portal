from sqlalchemy.orm import Session

from app.crud import scene as scene_crud
from app.models import Scene


def get_scene(db: Session, scene_id: int) -> Scene | None:
    return scene_crud.read_scene(db, scene_id)
