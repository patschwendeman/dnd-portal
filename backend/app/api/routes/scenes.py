from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models import Scene
from app.services import scene as scene_service

router = APIRouter()


@router.get("", response_model=None)
def read_scenes(db: SessionDep) -> list[Scene]:
    scene = scene_service.get_scenes(db)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.get("/{scene_id}", response_model=None)
def read_scene_by_id(scene_id: int, db: SessionDep) -> Scene:
    scene = scene_service.get_scene(db, scene_id)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.get("/details/", response_model=None)
def read_scene_details(db: SessionDep) -> list[Scene]:
    scenes = scene_service.get_scene_details(db)
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found")
    return scenes


@router.get("/details/{scene_id}", response_model=None)
def read_scene_detail_by_id(scene_id: int, db: SessionDep) -> Scene | list[Scene]:
    scenes = scene_service.get_scene_detail(db, scene_id)
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found")
    return scenes
