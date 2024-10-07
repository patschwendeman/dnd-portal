import json
import os
from sqlalchemy.orm import Session
from src.db.models import Scene, GraphicsWall, GraphicsGround, BattleMap, Music

SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'seed_data.json')

def load_seed_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def bulk_insert(db: Session, model, data):
    db.bulk_save_objects([model(**item) for item in data])
    db.commit()

def seed_data(db: Session, data):

    if not db.query(BattleMap).first():
        bulk_insert(db, BattleMap, data["battle_maps"])

    if not db.query(GraphicsWall).first():
        bulk_insert(db, GraphicsWall, data["graphics_walls"])

    if not db.query(GraphicsGround).first():
        bulk_insert(db, GraphicsGround, data["graphics_grounds"])

    if not db.query(Music).first():
        bulk_insert(db, Music, data["music"])

    if not db.query(Scene).first():
        for scene_data in data["scenes"]:
            music_ids = scene_data.pop("music_id", [])
            scene = Scene(**scene_data)
            scene.music = db.query(Music).filter(Music.id.in_(music_ids)).all()
            db.add(scene)
        db.commit()

def run_seeder(db: Session):
    seed_data_from_json = load_seed_data(SEED_DATA_PATH)
    seed_data(db, seed_data_from_json)
