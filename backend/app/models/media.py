from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.scene import scene_track

if TYPE_CHECKING:
    from app.models.scene import Scene


class WallImage(Base):
    __tablename__ = "wall_image"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    source: Mapped[str]
    scenes: Mapped[list["Scene"]] = relationship(back_populates="wall_image")


class GroundImage(Base):
    __tablename__ = "ground_image"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    source: Mapped[str]
    scene: Mapped["Scene | None"] = relationship(back_populates="ground_image")


class Track(Base):
    __tablename__ = "track"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    source: Mapped[str]
    scenes: Mapped[list["Scene"]] = relationship(secondary=scene_track, back_populates="tracks")
