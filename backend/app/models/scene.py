from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.media import GroundImage, Track, WallImage

scene_track = Table(
    "scene_track",
    Base.metadata,
    Column("scene_id", ForeignKey("scene.id"), primary_key=True),
    Column("track_id", ForeignKey("track.id"), primary_key=True),
)


class Scene(Base):
    __tablename__ = "scene"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str] = mapped_column(Text)
    main: Mapped[bool]
    wall_image_id: Mapped[int] = mapped_column(ForeignKey("wall_image.id"))
    wall_image: Mapped["WallImage"] = relationship(back_populates="scenes")
    ground_image_id: Mapped[int] = mapped_column(ForeignKey("ground_image.id"), unique=True)
    ground_image: Mapped["GroundImage"] = relationship(back_populates="scene")
    tracks: Mapped[list["Track"]] = relationship(secondary=scene_track, back_populates="scenes")
