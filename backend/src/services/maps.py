from sqlalchemy.orm import Session
from src.db.crud import read_all
from src.db.models import Scene

# pylint: disable=too-few-public-methods

class MapsService:
    @staticmethod
    def read_maps(db: Session, maptype: str):
        if maptype not in ("main", "side"):
            raise ValueError("Maptype must be either 'main' or 'side'")

        filter_main = maptype == "main"

        scenes = read_all(db, Scene)
        if not scenes:
            raise ValueError("Scenes not found")

        filtered_maps = []
        for scene in scenes:
            if scene.main is filter_main:
                filtered_maps.append({
                    'id': scene.id,
                    'source': scene.graphics_wall.source
                })

        return filtered_maps
