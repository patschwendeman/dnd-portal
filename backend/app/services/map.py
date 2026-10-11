from typing import Literal

from sqlalchemy.orm import Session

from app.crud import scene as scene_crud
from app.schemas import MapEntry

MapType = Literal["main", "side"]


def get_maps(db: Session, map_type: MapType) -> list[MapEntry]:
    if map_type not in ("main", "side"):
        raise ValueError("Maptype must be either 'main' or 'side'")

    filter_main = map_type == "main"

    maps: list[MapEntry] = []
    for scene in scene_crud.read_scenes_by_main(db, filter_main):
        image = scene.ground_image if scene.main else scene.wall_image
        # A missing image or source fails the schema validation (MapEntry.source is required).
        maps.append(MapEntry.model_validate({"id": scene.id, "source": image.source if image is not None else None}))
    return maps
