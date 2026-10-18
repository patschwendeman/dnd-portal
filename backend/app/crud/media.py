from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Media


def read_media_by_storage_key(db: Session, storage_key: str) -> Media | None:
    return db.scalars(select(Media).where(Media.storage_key == storage_key)).one_or_none()
