import json
from typing import Optional
from sqlalchemy.orm import Session
from db.models import BattleMap
from services.battlemaps import BattlemapService
from services.sidemaps import SidemapsService


class MapsService:

    @staticmethod
    def read_maps(filter_condition: Optional[bool], db: Session, maptype) -> json:
        if maptype == "battlemap":
            maps = BattlemapService.read_battlemaps(db, filter_condition)
        elif maptype == "sidemap":
            maps = SidemapsService.read_sidemaps(db)
        else:
            raise ValueError("Maps not found")
        if not maps:
            raise ValueError("Maps not found")
        return maps

    @staticmethod
    def read_map_by_id(db: Session, map_id: int) -> json:
        map_element = BattlemapService.read_battlemap_by_id(db, map_id)
        if not map_element:
            raise ValueError("Map not found")
        return map_element

    @staticmethod
    def update_map(db: Session, map_id: int, data) -> BattleMap:
        updated_map = BattlemapService.update_battlemap(db, map_id, data)
        if not updated_map:
            raise ValueError("updated map not found")
        return updated_map
