from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.adventure import Adventure
    from app.models.media import Media


class Player(Base):
    """A person with their character in one adventure; another adventure gets its own entry for the same person."""

    __tablename__ = "player"

    id: Mapped[int] = mapped_column(primary_key=True)
    adventure_id: Mapped[int] = mapped_column(ForeignKey("adventure.id"))
    adventure: Mapped["Adventure"] = relationship(back_populates="players")
    player_name: Mapped[str]
    character_name: Mapped[str]
    race: Mapped[str]
    # `class` is a Python keyword.
    character_class: Mapped[str]
    avatar_media_id: Mapped[int | None] = mapped_column(ForeignKey("media.id"))
    avatar: Mapped["Media | None"] = relationship()
