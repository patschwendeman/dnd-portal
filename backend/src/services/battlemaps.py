import json
from typing import Optional
from sqlalchemy.orm import Session
from db.crud import read_by_id, read_all
from db.models import BattleMap
from services.utility import filter_locked_battlemaps


class BattlemapService:

    @staticmethod
    def read_battlemaps(db: Session, filter: Optional[bool]) -> json:
        battlemaps = read_all(db, BattleMap)
        if filter == True:
            battlemaps = filter_locked_battlemaps(battlemaps)
        if not battlemaps:
            raise ValueError("BattleMap not found")
        return battlemaps
    
    @staticmethod
    def read_battlemaps_by_id(db: Session, battlemap_id: int) -> json:
        battlemap = read_by_id(db, BattleMap, battlemap_id)
        if not battlemap:
            raise ValueError("BattleMap not found")
        return battlemap