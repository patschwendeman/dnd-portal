from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.scene import scene_music_association


class GraphicsWall(Base):
    __tablename__ = "graphics_wall"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    source = Column(String)
    scene = relationship("Scene", back_populates="graphics_wall", uselist=False)


class GraphicsGround(Base):
    __tablename__ = "graphics_ground"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    source = Column(String)
    main = Column(Boolean)
    scene = relationship("Scene", back_populates="graphics_ground", uselist=False)


class Music(Base):
    __tablename__ = "music"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    source = Column(String)
    scenes = relationship("Scene", secondary=scene_music_association, back_populates="music")
