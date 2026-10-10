from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.services import map as map_service
from app.services.map import MapEntry

router = APIRouter()


@router.get("/side")
def read_sidemaps(db: SessionDep) -> list[MapEntry]:
    sidemaps = map_service.get_maps(db, "side")
    if sidemaps is None:
        raise HTTPException(status_code=404, detail="sideemaps not found")
    return sidemaps


@router.get("/main")
def read_mainmaps(db: SessionDep) -> list[MapEntry]:
    mainmaps = map_service.get_maps(db, "main")
    if mainmaps is None:
        raise HTTPException(status_code=404, detail="mainmaps not found")
    return mainmaps
