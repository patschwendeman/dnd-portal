from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import adventures, scenes
from app.core.config import settings
from app.db.migrate import run_migrations
from app.db.seed import run_seeder
from app.db.session import SessionLocal
from app.models.media import MEDIA_URL_PREFIX


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
    allow_methods=["GET", "PATCH"],
    allow_headers=["*"],
)

app.include_router(adventures.router, prefix="/adventures", tags=["adventures"])
app.include_router(scenes.router, prefix="/scenes", tags=["scenes"])
# check_dir=False keeps `import app.main` working without the media folder (e.g. when exporting the OpenAPI schema).
app.mount(MEDIA_URL_PREFIX, StaticFiles(directory=settings.media_dir, check_dir=False), name="media")
