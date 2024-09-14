from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db.database import engine, get_db
from db.models import Base
from db.seed import seed_data
from routes.scenes import scenes_router
from routes.maps import maps_router


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
seed_data(db)
