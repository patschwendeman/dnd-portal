from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud import media as media_crud
from app.crud import scene as scene_crud
from app.schemas import Track


def get_playlist(db: Session, scene_id: int | None) -> list[Track]:
    """Tracks of the scene (by ID); without a scene the default music, empty if its medium is missing."""
    if scene_id is None:
        default_music = media_crud.read_media_by_storage_key(db, settings.default_music_key)
        return [] if default_music is None else [Track.model_validate(default_music)]
    scene = scene_crud.read_scene(db, scene_id)
    return [] if scene is None else [Track.model_validate(track) for track in scene.tracks]
