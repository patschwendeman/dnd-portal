from sqlalchemy import BigInteger, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

MEDIA_URL_PREFIX = "/media"


class Media(Base):
    """A media file in the media folder; `kind` describes the file, not its use (one file can serve several scenes)."""

    __tablename__ = "media"
    __table_args__ = (CheckConstraint("kind IN ('image', 'audio')", name="kind"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str]
    name: Mapped[str]
    # Path relative to the media folder, e.g. images/wall_screen/forest.jpg
    storage_key: Mapped[str] = mapped_column(unique=True)
    content_type: Mapped[str]
    size: Mapped[int | None] = mapped_column(BigInteger)

    @property
    def source(self) -> str:
        """API-relative URL of the file (the frontend resolves it against the API base URL)."""
        return f"{MEDIA_URL_PREFIX}/{self.storage_key}"
