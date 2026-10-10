from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Integer, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.media import GraphicsGround, GraphicsWall, Music

scene_music_association = Table(
    "scene_music_association",
    Base.metadata,
    Column("scene_id", Integer, ForeignKey("scene.id")),
    Column("music_id", Integer, ForeignKey("music.id")),
)


class Scene(Base):
    __tablename__ = "scene"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str | None]
    description: Mapped[str | None] = mapped_column(Text)
    main: Mapped[bool | None]
    graphics_wall_id: Mapped[int | None] = mapped_column(ForeignKey("graphics_wall.id"))
    graphics_wall: Mapped["GraphicsWall | None"] = relationship(back_populates="scenes")
    graphics_ground_id: Mapped[int | None] = mapped_column(ForeignKey("graphics_ground.id"), unique=True)
    graphics_ground: Mapped["GraphicsGround | None"] = relationship(back_populates="scene")
    music_id: Mapped[int | None] = mapped_column(ForeignKey("music.id"))
    music: Mapped[list["Music"]] = relationship(secondary=scene_music_association, back_populates="scenes")
