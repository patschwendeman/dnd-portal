import json
from typing import Optional
from sqlalchemy.orm import Session
from src.db.crud import read_by_id, read_all, update
from src.db.models import BattleMap
from src.services.utility import filter_battlemaps, filter_locked_battlemaps


class BattlemapService:

    @staticmethod
    def read_battlemaps(db: Session, filter_condition: Optional[bool]) -> json:
        battlemaps = read_all(db, BattleMap)
        if filter_condition is True:
            battlemaps = filter_locked_battlemaps(battlemaps)
        if filter_condition is False:
            battlemaps = filter_battlemaps(battlemaps)
        if not battlemaps:
            raise ValueError("BattleMap not found")
        return battlemaps

    @staticmethod
    def read_battlemap_by_id(db: Session, battlemap_id: int) -> json:
        battlemap = read_by_id(db, BattleMap, battlemap_id)
        if not battlemap:
            raise ValueError("BattleMap not found")
        return battlemap

    @staticmethod
    def update_battlemap(db: Session, battlemap_id: int, data) -> BattleMap:
        updates = data.updates
        updated_battlemap = update(db, BattleMap, battlemap_id, updates)
        if not updated_battlemap:
            raise ValueError("Battlemap not found")
        return updated_battlemap
