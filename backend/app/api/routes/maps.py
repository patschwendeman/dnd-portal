from fastapi import APIRouter

from app.api.deps import SessionDep
from app.schemas import MapEntry
from app.services import map as map_service

router = APIRouter()


@router.get("/side")
def read_sidemaps(db: SessionDep) -> list[MapEntry]:
    return map_service.get_maps(db, "side")


@router.get("/main")
def read_mainmaps(db: SessionDep) -> list[MapEntry]:
    return map_service.get_maps(db, "main")
