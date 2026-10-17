from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.api.deps import SessionDep
from app.realtime.push import push_state
from app.schemas import GameTableState, GameTableUpdate
from app.services import game_table as game_table_service

router = APIRouter()

UPDATE_RESPONSES: dict[int | str, dict[str, Any]] = {
    422: {"description": "Adventure not found, or validation error"},
}


@router.get("")
def read_table(db: SessionDep) -> GameTableState:
    return game_table_service.get_state(db)


@router.patch("", responses=UPDATE_RESPONSES)
def update_table(update: GameTableUpdate, db: SessionDep, background_tasks: BackgroundTasks) -> GameTableState:
    try:
        state = game_table_service.update_state(db, update)
    except game_table_service.AdventureNotFoundError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    background_tasks.add_task(push_state)
    return state
