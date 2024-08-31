from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from services.battlemaps import BattlemapService
from db.database import get_db


battlemaps_router = APIRouter()


@battlemaps_router.get("/battlemaps")
def read_battlemaps(map_filter: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    battlemap = BattlemapService.read_battlemaps(db, map_filter)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap not found")
    return battlemap

@battlemaps_router.get("/battlemaps/{battlemap_id}")
def read_battlemaps_by_id(battlemap_id, db: Session = Depends(get_db)):
    battlemap = BattlemapService.read_battlemaps_by_id(db, battlemap_id)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap not found")
    return battlemap
