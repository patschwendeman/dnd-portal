from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.api.deps import SessionDep
from app.realtime.push import push_fight, push_state
from app.schemas import GameTableState, GameTableUpdate, JoinInfo
from app.services import fight as fight_service
from app.services import game_table as game_table_service

router = APIRouter()

UPDATE_RESPONSES: dict[int | str, dict[str, Any]] = {
    409: {"description": "Fight in progress: the active adventure cannot change"},
    422: {"description": "Adventure not found, or validation error"},
}


@router.get("")
def read_table(db: SessionDep) -> GameTableState:
    """The state of the game table that the screens also receive as `state` over the WebSocket."""
    return game_table_service.get_state(db)


@router.get("/join")
def read_join_info() -> JoinInfo:
    """The URL of the Player Screen in the LAN (null if not configured), the base of the QR code."""
    return game_table_service.get_join_info()


@router.patch("", responses=UPDATE_RESPONSES)
def update_table(update: GameTableUpdate, db: SessionDep, background_tasks: BackgroundTasks) -> GameTableState:
    """Changes the fields set in the body and pushes the state to all screens.

    A change of the active adventure also pushes its fight and closes the Wall overlay, unless the request sets
    one. 422 for an unknown adventure; 409 if the active adventure would change while it has a fight. On an
    error nothing is changed.
    """
    try:
        state = game_table_service.update_state(db, update)
    except game_table_service.AdventureNotFoundError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except fight_service.FightInProgressError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    background_tasks.add_task(push_state)
    if "active_adventure_id" in update.model_fields_set:
        # Admins, Walls and Players show the fight of the active adventure.
        background_tasks.add_task(push_fight)
    return state
