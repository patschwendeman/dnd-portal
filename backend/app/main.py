from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.database import engine, get_db
from app.db.models import Base
from app.db.seed import run_seeder
from app.routes.maps import maps_router
from app.routes.scenes import scenes_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(scenes_router)
app.include_router(maps_router)


db: Session = next(get_db())
run_seeder(db)
