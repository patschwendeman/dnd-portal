from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud import adventure as adventure_crud
from app.crud import game_table as game_table_crud
from app.realtime.wall_overlay import wall_overlay
from app.schemas import GameTableState, GameTableUpdate, JoinInfo


class AdventureNotFoundError(ValueError):
    pass


def get_state(db: Session) -> GameTableState:
    game_table = game_table_crud.read_game_table(db)
    adventure = game_table.active_adventure
    return GameTableState.model_validate(
        {
            "active_adventure_id": game_table.active_adventure_id,
            "active_scene_id": adventure.active_scene_id if adventure is not None else None,
            "theme": game_table.theme,
            "wall_overlay": wall_overlay.value,
        }
    )


def update_state(db: Session, update: GameTableUpdate) -> GameTableState:
    values = update.model_dump(exclude_unset=True)
    overlay = values.pop("wall_overlay", None)
    adventure_id = values.get("active_adventure_id")
    if adventure_id is not None and not adventure_crud.adventure_exists(db, adventure_id):
        raise AdventureNotFoundError("Adventure not found")

    game_table = game_table_crud.read_game_table(db)
    adventure_changed = "active_adventure_id" in values and adventure_id != game_table.active_adventure_id
    game_table_crud.update_game_table(db, game_table, values)
    # Set together with the stored fields, so that a single push follows; an overlay set in the same request wins.
    if overlay is not None:
        wall_overlay.value = overlay
    elif adventure_changed:
        wall_overlay.reset()
    # Read again: after the commit the relationship to the (new) active adventure has to be reloaded.
    db.expire_all()
    return get_state(db)


def scene_changed(db: Session, adventure_id: int) -> None:
    """The active scene of `adventure_id` changed: closes the overlay of the Walls if it is the active adventure."""
    if game_table_crud.read_game_table(db).active_adventure_id == adventure_id:
        wall_overlay.reset()


def get_join_info() -> JoinInfo:
    return JoinInfo(player_url=settings.player_url)
