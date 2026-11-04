from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.api.deps import SessionDep
from app.realtime.push import push_fight
from app.schemas import CombatantCreate, CombatantUpdate, FightOrder, FightStart, FightState, TurnRequest
from app.services import fight as fight_service

router = APIRouter()

NO_ACTIVE_ADVENTURE: dict[int | str, dict[str, Any]] = {409: {"description": "No active adventure"}}
NO_FIGHT: dict[int | str, dict[str, Any]] = {
    **NO_ACTIVE_ADVENTURE,
    404: {"description": "No fight"},
}
START_RESPONSES: dict[int | str, dict[str, Any]] = {
    409: {"description": "No active adventure, no active scene, or fight in progress"},
    422: {"description": "Player of another adventure, duplicate player or number, or validation error"},
}
TURN_RESPONSES: dict[int | str, dict[str, Any]] = {**NO_FIGHT, 422: {"description": "Validation error"}}
ADD_RESPONSES: dict[int | str, dict[str, Any]] = {
    **NO_FIGHT,
    422: {"description": "Player of another adventure, player or number already taking part, or validation error"},
}
COMBATANT_RESPONSES: dict[int | str, dict[str, Any]] = {
    **NO_ACTIVE_ADVENTURE,
    404: {"description": "No fight, or combatant not found"},
    422: {"description": "Validation error"},
}
ORDER_RESPONSES: dict[int | str, dict[str, Any]] = {
    **NO_FIGHT,
    422: {"description": "Not exactly the IDs of the current combatants, or validation error"},
}


@contextmanager
def _http_errors() -> Iterator[None]:
    try:
        yield
    except fight_service.FightConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except fight_service.FightNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except fight_service.InvalidFightChangeError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error


@router.get("")
def read_fight(db: SessionDep) -> FightState | None:
    """The fight of the active adventure; null without one."""
    return fight_service.get_fight(db)


@router.post("", status_code=status.HTTP_201_CREATED, responses=START_RESPONSES)
def start_fight(start: FightStart, db: SessionDep, background_tasks: BackgroundTasks) -> FightState:
    with _http_errors():
        fight = fight_service.start_fight(db, start)
    background_tasks.add_task(push_fight)
    return fight


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, responses=NO_FIGHT)
def end_fight(db: SessionDep, background_tasks: BackgroundTasks) -> None:
    with _http_errors():
        fight_service.end_fight(db)
    background_tasks.add_task(push_fight)


@router.post("/turn", responses=TURN_RESPONSES)
def end_turn(turn: TurnRequest, db: SessionDep, background_tasks: BackgroundTasks) -> FightState:
    """If it is no longer the turn of `from_combatant_id`, the current state is returned and nothing is pushed."""
    with _http_errors():
        fight, changed = fight_service.end_turn(db, turn.from_combatant_id)
    if changed:
        background_tasks.add_task(push_fight)
    return fight


@router.post("/combatants", status_code=status.HTTP_201_CREATED, responses=ADD_RESPONSES)
def add_combatant(new: CombatantCreate, db: SessionDep, background_tasks: BackgroundTasks) -> FightState:
    with _http_errors():
        fight = fight_service.add_combatant(db, new)
    background_tasks.add_task(push_fight)
    return fight


@router.patch("/combatants/{combatant_id}", responses=COMBATANT_RESPONSES)
def update_combatant(
    combatant_id: int, update: CombatantUpdate, db: SessionDep, background_tasks: BackgroundTasks
) -> FightState:
    with _http_errors():
        fight = fight_service.set_defeated(db, combatant_id, update.defeated)
    background_tasks.add_task(push_fight)
    return fight


@router.delete("/combatants/{combatant_id}", responses=COMBATANT_RESPONSES)
def remove_combatant(combatant_id: int, db: SessionDep, background_tasks: BackgroundTasks) -> FightState:
    with _http_errors():
        fight = fight_service.remove_combatant(db, combatant_id)
    background_tasks.add_task(push_fight)
    return fight


@router.put("/order", responses=ORDER_RESPONSES)
def reorder(order: FightOrder, db: SessionDep, background_tasks: BackgroundTasks) -> FightState:
    with _http_errors():
        fight = fight_service.reorder(db, order.combatant_ids)
    background_tasks.add_task(push_fight)
    return fight
