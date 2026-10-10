from typing import Literal

from sqlalchemy.orm import Session

from app.crud import scene as scene_crud

MapType = Literal["main", "side"]


def get_maps(db: Session, map_type: MapType) -> list[dict[str, object]]:
    if map_type not in ("main", "side"):
        raise ValueError("Maptype must be either 'main' or 'side'")

    filter_main = map_type == "main"

    scenes = scene_crud.read_scenes(db)
    if not scenes:
        raise ValueError("Scenes not found")

    filtered_maps = []
    for scene in scenes:
        if scene.main is filter_main:
            source = scene.graphics_ground.source if scene.main else scene.graphics_wall.source
            filtered_maps.append({"id": scene.id, "source": source})

    return filtered_maps
