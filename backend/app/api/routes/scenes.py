from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models import Scene
from app.schemas import SceneDetail
from app.services import scene as scene_service

router = APIRouter()

NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "Scene not found"}}


@router.get("/{scene_id}", response_model=SceneDetail, responses=NOT_FOUND)
def read_scene(scene_id: int, db: SessionDep) -> Scene:
    """The scene with its images and tracks; 404 for an unknown scene."""
    scene = scene_service.get_scene(db, scene_id)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene
