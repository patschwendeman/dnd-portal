from collections.abc import Sequence

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import fight as fight_crud
from app.crud import game_table as game_table_crud
from app.models import Adventure, Combatant, Fight
from app.schemas import CombatantCreate, FightStart, FightState


class FightConflictError(Exception):
    """The request does not fit the state of the game table (409)."""


class NoActiveAdventureError(FightConflictError):
    def __init__(self) -> None:
        super().__init__("No active adventure")


class NoActiveSceneError(FightConflictError):
    def __init__(self) -> None:
        super().__init__("No active scene")


class FightInProgressError(FightConflictError):
    """Also raised by the game table and adventure services: scene and adventure are locked during a fight."""

    def __init__(self) -> None:
        super().__init__("Fight in progress")


class FightNotFoundError(Exception):
    """No fight, or no such combatant in it (404)."""


class NoFightError(FightNotFoundError):
    def __init__(self) -> None:
        super().__init__("No fight")


class CombatantNotFoundError(FightNotFoundError):
    def __init__(self) -> None:
        super().__init__("Combatant not found")


class InvalidFightChangeError(ValueError):
    """The request is valid on its own, but not for this fight (422)."""


def _active_adventure(db: Session) -> Adventure:
    adventure = game_table_crud.read_game_table(db).active_adventure
    if adventure is None:
        raise NoActiveAdventureError
    return adventure


def _locked_fight(db: Session) -> Fight:
    fight = fight_crud.read_fight(db, _active_adventure(db).id, for_update=True)
    if fight is None:
        raise NoFightError
    return fight


def _combatant(fight: Fight, combatant_id: int) -> Combatant:
    for combatant in fight.combatants:
        if combatant.id == combatant_id:
            return combatant
    raise CombatantNotFoundError


def _next_active(combatants: Sequence[Combatant], index: int) -> tuple[Combatant | None, bool]:
    """The next combatant after `index` that is not defeated, and whether the search went past the end of the list."""
    for step in range(1, len(combatants) + 1):
        candidate = combatants[(index + step) % len(combatants)]
        if not candidate.defeated:
            return candidate, index + step >= len(combatants)
    return None, False


def _activate_first_if_nobody(fight: Fight) -> None:
    if fight.active_combatant_id is None:
        fight.active_combatant_id = next((c.id for c in fight.combatants if not c.defeated), None)


def _rejection(new: CombatantCreate, existing: Sequence[Combatant], adventure_player_ids: set[int]) -> str | None:
    if new.player_id is not None:
        if new.player_id not in adventure_player_ids:
            return "Player does not belong to the active adventure"
        if any(c.player_id == new.player_id for c in existing):
            return "Player already takes part"
    elif any(c.number == new.number for c in existing):
        return "Number already taken"
    return None


def _check_new_combatants(db: Session, adventure_id: int, fight: Fight | None, new: list[CombatantCreate]) -> None:
    """Duplicates within `new` are rejected by the schema already."""
    existing = fight.combatants if fight is not None else []
    adventure_player_ids = fight_crud.read_player_ids(db, adventure_id)
    for combatant in new:
        rejection = _rejection(combatant, existing, adventure_player_ids)
        if rejection is not None:
            raise InvalidFightChangeError(rejection)


def _commit(db: Session, fight: Fight) -> FightState:
    db.commit()
    # Read again: the commit expired the fight, and the order of the combatants may have changed.
    db.refresh(fight)
    return FightState.model_validate(fight)


def get_fight(db: Session) -> FightState | None:
    """The fight of the active adventure; None without one (also without an active adventure)."""
    adventure_id = game_table_crud.read_game_table(db).active_adventure_id
    fight = fight_crud.read_fight(db, adventure_id) if adventure_id is not None else None
    return FightState.model_validate(fight) if fight is not None else None


def start_fight(db: Session, start: FightStart) -> FightState:
    """Round 1, the first combatant of the list has the turn; the fight belongs to the active scene."""
    adventure = _active_adventure(db)
    if adventure.active_scene_id is None:
        raise NoActiveSceneError
    if fight_crud.fight_exists(db, adventure.id):
        raise FightInProgressError
    _check_new_combatants(db, adventure.id, None, start.combatants)

    combatants = [Combatant(position=index, **c.model_dump()) for index, c in enumerate(start.combatants)]
    fight = Fight(adventure_id=adventure.id, scene_id=adventure.active_scene_id, combatants=combatants)
    try:
        fight_crud.create_fight(db, fight)
        fight.active_combatant_id = combatants[0].id
        return _commit(db, fight)
    except IntegrityError as error:
        # Another request started a fight for this adventure in the meantime.
        db.rollback()
        raise FightInProgressError from error


def end_fight(db: Session) -> None:
    fight_crud.delete_fight(db, _locked_fight(db))


def end_turn(db: Session, from_combatant_id: int) -> tuple[FightState, bool]:
    """The turn passes to the next combatant that is not defeated; past the end of the list a new round starts.

    Returns the state and whether it changed: if it is no longer the turn of `from_combatant_id` (double click, a second
    Admin window), nothing changes.
    """
    fight = _locked_fight(db)
    if fight.active_combatant_id != from_combatant_id:
        return FightState.model_validate(fight), False
    index = fight.combatants.index(_combatant(fight, from_combatant_id))
    successor, new_round = _next_active(fight.combatants, index)
    fight.active_combatant_id = successor.id if successor is not None else None
    if successor is not None and new_round:
        fight.round += 1
    return _commit(db, fight), True


def add_combatant(db: Session, new: CombatantCreate) -> FightState:
    """At the end of the initiative; if nobody has the turn, the first combatant not defeated gets it."""
    fight = _locked_fight(db)
    _check_new_combatants(db, fight.adventure_id, fight, [new])
    position = max((c.position for c in fight.combatants), default=-1) + 1
    fight.combatants.append(Combatant(position=position, **new.model_dump()))
    db.flush()
    _activate_first_if_nobody(fight)
    return _commit(db, fight)


def set_defeated(db: Session, combatant_id: int, defeated: bool) -> FightState:
    """A defeated combatant keeps a running turn, but is skipped afterwards; taking it back can end "nobody's turn"."""
    fight = _locked_fight(db)
    _combatant(fight, combatant_id).defeated = defeated
    _activate_first_if_nobody(fight)
    return _commit(db, fight)


def remove_combatant(db: Session, combatant_id: int) -> FightState:
    """Removing the combatant whose turn it is passes the turn on, without a new round."""
    fight = _locked_fight(db)
    combatant = _combatant(fight, combatant_id)
    if fight.active_combatant_id == combatant.id:
        successor, _ = _next_active(fight.combatants, fight.combatants.index(combatant))
        fight.active_combatant_id = successor.id if successor is not None and successor is not combatant else None
    fight.combatants.remove(combatant)
    return _commit(db, fight)


def reorder(db: Session, combatant_ids: list[int]) -> FightState:
    fight = _locked_fight(db)
    current = {c.id: c for c in fight.combatants}
    if len(combatant_ids) != len(current) or set(combatant_ids) != set(current):
        raise InvalidFightChangeError("combatant_ids must contain each combatant of the fight exactly once")
    for position, combatant_id in enumerate(combatant_ids):
        current[combatant_id].position = position
    return _commit(db, fight)


def check_unlocked(db: Session, adventure_id: int) -> None:
    """Scene and adventure stay as they are while the adventure has a fight."""
    if fight_crud.fight_exists(db, adventure_id):
        raise FightInProgressError
