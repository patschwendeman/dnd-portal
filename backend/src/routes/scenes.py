from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.scenes import SceneService
from db.database import get_db


scenes_router = APIRouter()


@scenes_router.get("/scenes")
def read_scenes(db: Session = Depends(get_db)):
    scene = SceneService.read_scenes(db)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene

@scenes_router.get("/scenes/{scene_id}")
def read_scene_by_id(scene_id: int, db: Session = Depends(get_db)):
    scene = SceneService.read_scene_by_id(scene_id, db)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene

@scenes_router.get("/scenes/details/")
def read_scene_details(db: Session = Depends(get_db)):
    scenes = SceneService.read_scene_details(db)
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found")
    return scenes
