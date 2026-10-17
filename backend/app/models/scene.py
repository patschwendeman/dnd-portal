from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.adventure import Adventure
    from app.models.media import Media

scene_track = Table(
    "scene_track",
    Base.metadata,
    Column("scene_id", ForeignKey("scene.id"), primary_key=True),
    Column("media_id", ForeignKey("media.id"), primary_key=True),
)


class Scene(Base):
    __tablename__ = "scene"
    id: Mapped[int] = mapped_column(primary_key=True)
    adventure_id: Mapped[int] = mapped_column(ForeignKey("adventure.id"))
    adventure: Mapped["Adventure"] = relationship(back_populates="scenes", foreign_keys=[adventure_id])
    name: Mapped[str]
    description: Mapped[str] = mapped_column(Text)
    main: Mapped[bool]
    wall_image_id: Mapped[int] = mapped_column(ForeignKey("media.id"))
    wall_image: Mapped["Media"] = relationship(foreign_keys=[wall_image_id])
    ground_image_id: Mapped[int] = mapped_column(ForeignKey("media.id"), unique=True)
    ground_image: Mapped["Media"] = relationship(foreign_keys=[ground_image_id])
    tracks: Mapped[list["Media"]] = relationship(secondary=scene_track)
