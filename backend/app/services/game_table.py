from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud import adventure as adventure_crud
from app.crud import game_table as game_table_crud
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
        }
    )


def update_state(db: Session, update: GameTableUpdate) -> GameTableState:
    values = update.model_dump(exclude_unset=True)
    adventure_id = values.get("active_adventure_id")
    if adventure_id is not None and not adventure_crud.adventure_exists(db, adventure_id):
        raise AdventureNotFoundError("Adventure not found")

    game_table_crud.update_game_table(db, game_table_crud.read_game_table(db), values)
    # Read again: after the commit the relationship to the (new) active adventure has to be reloaded.
    db.expire_all()
    return get_state(db)


def get_join_info() -> JoinInfo:
    return JoinInfo(player_url=settings.player_url)
