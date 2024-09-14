from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.schema import BattleMapUpdate
from db.database import get_db
from services.maps import MapsService


maps_router = APIRouter()

@maps_router.get("/maps/sidemaps")
def read_sidemaps(players: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    maptype = 'sidemap'
    sidemaps = MapsService.read_maps(db, players, maptype)
    if sidemaps is None:
        raise HTTPException(status_code=404, detail="sideemaps not found")
    return sidemaps

@maps_router.get("/maps/battlemaps")
def read_battlemaps(players: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    maptype = 'battlemap'
    battlemap = MapsService.read_maps(db, players, maptype)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemaps not found")
    return battlemap

@maps_router.get("/maps/battlemaps/{battlemap_id}")
def read_battlemap_by_id(battlemap_id: int, db: Session = Depends(get_db)):
    battlemap = MapsService.read_map_by_id(db, battlemap_id)
    if battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap not found")
    return battlemap

@maps_router.put("/maps/battlemaps/{battlemap_id}")
def update_map_route(battlemap_id: int, data: BattleMapUpdate, db: Session = Depends(get_db)):
    updated_battlemap = MapsService.update_map(db, battlemap_id, data)
    if updated_battlemap is None:
        raise HTTPException(status_code=404, detail="Battlemap to update not found")
    return updated_battlemap
