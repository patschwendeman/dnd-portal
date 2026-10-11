import json
import os
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import GroundImage, Scene, Track, WallImage

SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "seed_data.json")


def load_seed_data(file_path: str) -> dict[str, Any]:
    with open(file_path, encoding="utf-8") as file:
        data: dict[str, Any] = json.load(file)
    return data


def is_empty(db: Session, model: type[Base]) -> bool:
    return db.scalar(select(model).limit(1)) is None


def bulk_insert(db: Session, model: type[Base], data: list[dict[str, Any]]) -> None:
    db.add_all([model(**item) for item in data])
    db.commit()


def seed_data(db: Session, data: dict[str, Any]) -> None:
    if is_empty(db, WallImage):
        bulk_insert(db, WallImage, data["wall_images"])

    if is_empty(db, GroundImage):
        bulk_insert(db, GroundImage, data["ground_images"])

    if is_empty(db, Track):
        bulk_insert(db, Track, data["tracks"])

    if is_empty(db, Scene):
        for scene_data in data["scenes"]:
            track_ids = scene_data.pop("track_ids", [])
            scene = Scene(**scene_data)
            scene.tracks = list(db.scalars(select(Track).where(Track.id.in_(track_ids))))
            db.add(scene)
        db.commit()


def run_seeder(db: Session) -> None:
    seed_data_from_json = load_seed_data(SEED_DATA_PATH)
    seed_data(db, seed_data_from_json)
