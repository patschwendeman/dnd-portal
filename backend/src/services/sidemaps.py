import json
from sqlalchemy.orm import Session
from src.db.crud import read_all
from src.db.models import Scene


class SidemapsService:

    @staticmethod
    def read_sidemaps(db: Session) -> json:
        scenes = read_all(db, Scene)
        if not scenes:
            raise ValueError("scenes to filter sidemaps not found")
        side_maps = []
        for scene in scenes:
            if scene.fight is False:
                side_maps.append({
                    'id': scene.id,
                    'source': scene.graphics_wall.source
                })
        return side_maps

    @staticmethod
    def read_sidemap_by_id() -> ValueError:
        # Add function to read sidemap by id
        return ValueError("function not implementet yet")
