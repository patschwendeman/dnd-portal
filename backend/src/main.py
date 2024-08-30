from fastapi import FastAPI

from db.database import engine, init_db
from db.models import Base
from routes.scenes import scenes_router
from routes.battlemaps import battlemaps_router



app = FastAPI()
Base.metadata.create_all(bind=engine)

app.include_router(scenes_router)
app.include_router(battlemaps_router)

init_db()
