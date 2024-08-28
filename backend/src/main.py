from fastapi import FastAPI
from sqlalchemy.orm import Session
#from routes import scene  
from db.database import engine, SessionLocal
from db.models import Base
from db.seed import seed_data


app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)

# Include the router
#app.include_router(scene.router, prefix="/scenes", tags=["scenes"])


def init_db():
    db: Session = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

init_db()