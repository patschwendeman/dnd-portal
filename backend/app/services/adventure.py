from sqlalchemy.orm import Session

from app.crud import adventure as adventure_crud
from app.crud import scene as scene_crud
from app.models import Adventure, Scene
from app.schemas import AdventureUpdate, MapEntry
from app.services import map as map_service
from app.services.map import MapType


class SceneNotInAdventureError(ValueError):
    """The requested active scene does not exist or belongs to another adventure."""


def get_adventures(db: Session) -> list[Adventure]:
    return adventure_crud.read_adventures(db)


def get_adventure(db: Session, adventure_id: int) -> Adventure | None:
    return adventure_crud.read_adventure(db, adventure_id)


def get_scenes(db: Session, adventure_id: int) -> list[Scene] | None:
    if not adventure_crud.adventure_exists(db, adventure_id):
        return None
    return scene_crud.read_scenes(db, adventure_id)


def get_maps(db: Session, adventure_id: int, map_type: MapType) -> list[MapEntry] | None:
    if not adventure_crud.adventure_exists(db, adventure_id):
        return None
    return map_service.get_maps(db, map_type, adventure_id)


def update_adventure(db: Session, adventure_id: int, update: AdventureUpdate) -> Adventure | None:
    adventure = adventure_crud.read_adventure(db, adventure_id)
    if adventure is None:
        return None

    values = update.model_dump(exclude_unset=True)
    scene_id = values.get("active_scene_id")
    if scene_id is not None and scene_crud.read_scene_adventure_id(db, scene_id) != adventure_id:
        raise SceneNotInAdventureError("Scene does not belong to adventure")

    adventure_crud.update_adventure(db, adventure, values)
    return adventure_crud.read_adventure(db, adventure_id)
