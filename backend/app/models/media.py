from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.scene import scene_music_association

if TYPE_CHECKING:
    from app.models.scene import Scene


class GraphicsWall(Base):
    __tablename__ = "graphics_wall"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str | None]
    source: Mapped[str | None]
    scenes: Mapped[list["Scene"]] = relationship(back_populates="graphics_wall")


class GraphicsGround(Base):
    __tablename__ = "graphics_ground"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str | None]
    source: Mapped[str | None]
    main: Mapped[bool | None]
    scene: Mapped["Scene | None"] = relationship(back_populates="graphics_ground")


class Music(Base):
    __tablename__ = "music"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str | None]
    source: Mapped[str | None]
    scenes: Mapped[list["Scene"]] = relationship(secondary=scene_music_association, back_populates="music")
