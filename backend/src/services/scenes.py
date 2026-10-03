from typing import List
from sqlalchemy.orm import Session
from src.db.crud import read_by_id, read_all, read_join_all
from src.db.models import Scene


class SceneService:

    @staticmethod
    def read_scenes(db: Session) -> Scene:
        scenes = read_all(db, Scene)
        if not scenes:
            raise ValueError("Scene not found")
        return scenes

    @staticmethod
    def read_scene_by_id(scene_id: int, db: Session) -> Scene:
        scene = read_by_id(db, Scene, scene_id)
        if not scene:
            raise ValueError("Scene not found")
        return scene

    @staticmethod
    def read_scene_details(db: Session) -> List[Scene]:
        scenes = read_join_all(db)
        if not scenes:
            raise ValueError("No scenes found")
        return scenes

    @staticmethod
    def read_scene_detail_by_id(scene_id: int, db: Session) -> Scene:
        scenes = read_join_all(db)
        for scene in scenes:
            if scene.id == scene_id:
                return scene
        if not scenes:
            raise ValueError("No scene found")
        return scenes
