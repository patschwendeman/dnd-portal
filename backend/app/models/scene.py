from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship

from app.db.base import Base

scene_music_association = Table(
    "scene_music_association",
    Base.metadata,
    Column("scene_id", Integer, ForeignKey("scene.id")),
    Column("music_id", Integer, ForeignKey("music.id")),
)


class Scene(Base):
    __tablename__ = "scene"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text)
    main = Column(Boolean)
    graphics_wall_id = Column(Integer, ForeignKey("graphics_wall.id"))
    graphics_wall = relationship("GraphicsWall", back_populates="scene", uselist=False)
    graphics_ground_id = Column(Integer, ForeignKey("graphics_ground.id"), unique=True)
    graphics_ground = relationship("GraphicsGround", back_populates="scene", uselist=False)
    music_id = Column(Integer, ForeignKey("music.id"))
    music = relationship("Music", secondary=scene_music_association, back_populates="scenes")
