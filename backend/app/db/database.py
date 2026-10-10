import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DRIVERNAME = os.environ.get("DRIVERNAME")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")
POSTGRES_DB = os.environ.get("POSTGRES_DB")
PORT = os.environ.get("PORT")
HOST = os.environ.get("HOST")

url = URL.create(
    drivername=DRIVERNAME,  # type: ignore[arg-type]
    username=POSTGRES_USER,
    host=HOST,
    password=POSTGRES_PASSWORD,
    database=POSTGRES_DB,
    port=PORT,  # type: ignore[arg-type]
)

engine = create_engine(url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
