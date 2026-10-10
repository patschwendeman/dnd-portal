from typing import Literal

from sqlalchemy.orm import Session
from typing_extensions import TypedDict

from app.crud import scene as scene_crud

MapType = Literal["main", "side"]


class MapEntry(TypedDict):
    id: int
    source: str | None


def get_maps(db: Session, map_type: MapType) -> list[MapEntry]:
    if map_type not in ("main", "side"):
        raise ValueError("Maptype must be either 'main' or 'side'")

    filter_main = map_type == "main"

    filtered_maps: list[MapEntry] = []
    for scene in scene_crud.read_scenes_by_main(db, filter_main):
        graphic = scene.graphics_ground if scene.main else scene.graphics_wall
        if graphic is None:
            raise ValueError(f"Scene {scene.id} has no graphic for its map type")
        filtered_maps.append({"id": scene.id, "source": graphic.source})

    return filtered_maps
