from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import URL

from dotenv import load_dotenv
import os
load_dotenv()

DRIVERNAME = os.environ.get('DRIVERNAME')
POSTGRES_USER = os.environ.get('POSTGRES_USER')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD')
POSTGRES_DB = os.environ.get('POSTGRES_DB')
PORT = os.environ.get('PORT')
HOST = os.environ.get('HOST')

url = URL.create(
    drivername=DRIVERNAME,
    username=POSTGRES_USER,
    host=HOST,
    password=POSTGRES_PASSWORD,
    database=POSTGRES_DB,
    port=PORT
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