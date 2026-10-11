from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import maps, scenes
from app.core.config import settings
from app.db.migrate import run_migrations
from app.db.seed import run_seeder
from app.db.session import SessionLocal


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    run_migrations()
    with SessionLocal() as db:
        run_seeder(db)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
app.include_router(maps.router, prefix="/maps", tags=["maps"])
