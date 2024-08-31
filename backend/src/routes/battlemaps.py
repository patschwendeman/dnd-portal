from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.schema import BattleMapUpdate
from db.database import get_db
from services.battlemaps import BattlemapService


battlemaps_router = APIRouter()


@battlemaps_router.get("/battlemaps")
def read_battlemaps(filter_element: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    battlemap = BattlemapService.read_battlemaps(db, filter_element)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap not found")
    return battlemap

@battlemaps_router.get("/battlemaps/{battlemap_id}")
def read_battlemaps_by_id(battlemap_id: int, db: Session = Depends(get_db)):
    battlemap = BattlemapService.read_battlemaps_by_id(db, battlemap_id)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap not found")
    return battlemap

@battlemaps_router.put("/battlemaps/{battlemap_id}")
def update_battlemap_route(battlemap_id: int, data: BattleMapUpdate, db: Session = Depends(get_db)):
    try:
        updated_battlemap = BattlemapService.update_battlemap(db, battlemap_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return updated_battlemap
