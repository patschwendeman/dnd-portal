from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.services.maps import MapsService


maps_router = APIRouter()

@maps_router.get("/maps/side")
def read_sidemaps(db: Session = Depends(get_db)):
    maptype = 'side'
    sidemaps = MapsService.read_maps(db, maptype)
    if sidemaps is None:
        raise HTTPException(status_code=404, detail="sideemaps not found")
    return sidemaps

@maps_router.get("/maps/main")
def read_mainmaps(db: Session = Depends(get_db)):
    maptype = 'main'
    mainmaps = MapsService.read_maps(db, maptype)
    if mainmaps is None:
        raise HTTPException(status_code=404, detail="mainmaps not found")
    return mainmaps
