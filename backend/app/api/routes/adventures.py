from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.api.deps import SessionDep
from app.models import Adventure, Scene
from app.realtime.push import push_state
from app.schemas import AdventureDetail, AdventureSummary, AdventureUpdate, SceneDetail
from app.services import adventure as adventure_service
from app.services import fight as fight_service

router = APIRouter()

NOT_FOUND_DETAIL = "Adventure not found"
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": NOT_FOUND_DETAIL}}
UPDATE_RESPONSES: dict[int | str, dict[str, Any]] = {
    **NOT_FOUND,
    409: {"description": "Fight in progress: the active scene cannot change"},
    422: {"description": "Scene does not belong to adventure, or validation error"},
}


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)


@router.get("", response_model=list[AdventureSummary])
def read_adventures(db: SessionDep) -> list[Adventure]:
    """All adventures, ordered by ID, each with its level, players and adventure image (for the selection)."""
    return adventure_service.get_adventures(db)


@router.get("/{adventure_id}", response_model=AdventureDetail, responses=NOT_FOUND)
def read_adventure(adventure_id: int, db: SessionDep) -> Adventure:
    """The adventure with its players and background images; 404 for an unknown adventure."""
    adventure = adventure_service.get_adventure(db, adventure_id)
    if adventure is None:
        raise _not_found()
    return adventure


@router.patch("/{adventure_id}", response_model=AdventureDetail, responses=UPDATE_RESPONSES)
def update_adventure(
    adventure_id: int, update: AdventureUpdate, db: SessionDep, background_tasks: BackgroundTasks
) -> Adventure:
    """Changes the fields set in the body and pushes the state to all screens.

    404 for an unknown adventure; 422 if the active scene does not exist or belongs to another adventure; 409 if
    the active scene would change while the adventure has a fight. On an error nothing is changed.
    """
    try:
        adventure = adventure_service.update_adventure(db, adventure_id, update)
    except adventure_service.SceneNotInAdventureError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except fight_service.FightInProgressError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if adventure is None:
        raise _not_found()
    # Always pushed, also for an adventure that is not active: the snapshot is cheap.
    background_tasks.add_task(push_state)
    return adventure


@router.get("/{adventure_id}/scenes", response_model=list[SceneDetail], responses=NOT_FOUND)
def read_adventure_scenes(adventure_id: int, db: SessionDep) -> list[Scene]:
    """The scenes of the adventure, ordered by ID (an empty list without scenes); 404 for an unknown adventure."""
    scenes = adventure_service.get_scenes(db, adventure_id)
    if scenes is None:
        raise _not_found()
    return scenes
