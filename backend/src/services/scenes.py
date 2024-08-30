from sqlalchemy.orm import Session
from db.crud import read_by_id, read_all
from db.models import Scene


class SceneService:

    @staticmethod
    def read_scenes(db: Session) -> Scene:
        scenes = read_all(db, Scene)
        if not scenes:
            raise ValueError("Scene not found")
        return scenes
    
    @staticmethod
    def read_scene_by_id(db: Session, scene_id: int) -> Scene:
        scene = read_by_id(db, Scene, scene_id)
        if not scene:
            raise ValueError("Scene not found")
        return scene