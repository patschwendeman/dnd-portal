from sqlalchemy.orm import Session

from app.crud import scene as scene_crud
from app.models import Scene


def get_scenes(db: Session) -> list[Scene]:
    scenes = scene_crud.read_scenes(db)
    if not scenes:
        raise ValueError("Scene not found")
    return scenes


def get_scene(db: Session, scene_id: int) -> Scene:
    scene = scene_crud.read_scene(db, scene_id)
    if not scene:
        raise ValueError("Scene not found")
    return scene


def get_scene_details(db: Session) -> list[Scene]:
    scenes = scene_crud.read_scenes_with_relations(db)
    if not scenes:
        raise ValueError("No scenes found")
    return scenes


def get_scene_detail(db: Session, scene_id: int) -> Scene | list[Scene]:
    scenes = scene_crud.read_scenes_with_relations(db)
    for scene in scenes:
        if scene.id == scene_id:
            return scene
    if not scenes:
        raise ValueError("No scene found")
    return scenes
