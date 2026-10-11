import json
import logging
import mimetypes
import os
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import Base
from app.models import Media, Scene

SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "seed_data.json")
DEFAULT_CONTENT_TYPE = "application/octet-stream"

logger = logging.getLogger(__name__)


def load_seed_data(file_path: str) -> dict[str, Any]:
    with open(file_path, encoding="utf-8") as file:
        data: dict[str, Any] = json.load(file)
    return data


def is_empty(db: Session, model: type[Base]) -> bool:
    return db.scalar(select(model).limit(1)) is None


def guess_content_type(storage_key: str) -> str:
    content_type, _encoding = mimetypes.guess_type(storage_key)
    return content_type or DEFAULT_CONTENT_TYPE


def build_media(item: dict[str, Any], media_dir: Path) -> Media:
    """Media entry with content type and size; a missing file only logs a warning so that the start is not blocked."""
    storage_key: str = item["storage_key"]
    path = media_dir / storage_key
    size: int | None = None
    if path.is_file():
        size = path.stat().st_size
    else:
        logger.warning("Media file %s not found in %s; seeding the entry without size", storage_key, media_dir)
    return Media(
        kind=item["kind"],
        name=item["name"],
        storage_key=storage_key,
        content_type=guess_content_type(storage_key),
        size=size,
    )


def seed_data(db: Session, data: dict[str, Any], media_dir: Path) -> None:
    if is_empty(db, Media):
        db.add_all([build_media(item, media_dir) for item in data["media"]])
        db.commit()

    if is_empty(db, Scene):
        for item in data["scenes"]:
            scene_data = dict(item)
            track_ids = scene_data.pop("track_ids", [])
            scene = Scene(**scene_data)
            scene.tracks = list(db.scalars(select(Media).where(Media.id.in_(track_ids))))
            db.add(scene)
        db.commit()


def run_seeder(db: Session) -> None:
    seed_data_from_json = load_seed_data(SEED_DATA_PATH)
    seed_data(db, seed_data_from_json, settings.media_dir)
