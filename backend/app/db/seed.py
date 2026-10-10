import json
import os
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import GraphicsGround, GraphicsWall, Music, Scene

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
    if is_empty(db, GraphicsWall):
        bulk_insert(db, GraphicsWall, data["graphics_walls"])

    if is_empty(db, GraphicsGround):
        bulk_insert(db, GraphicsGround, data["graphics_grounds"])

    if is_empty(db, Music):
        bulk_insert(db, Music, data["music"])

    if is_empty(db, Scene):
        for scene_data in data["scenes"]:
            music_ids = scene_data.pop("music_id", [])
            scene = Scene(**scene_data)
            scene.music = list(db.scalars(select(Music).where(Music.id.in_(music_ids))))
            db.add(scene)
        db.commit()


def run_seeder(db: Session) -> None:
    seed_data_from_json = load_seed_data(SEED_DATA_PATH)
    seed_data(db, seed_data_from_json)
