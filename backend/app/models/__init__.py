"""All models in one place, so that importing `app.models` registers every table on `Base.metadata`."""

from app.models.media import GraphicsGround, GraphicsWall, Music
from app.models.scene import Scene, scene_music_association

__all__ = ["GraphicsGround", "GraphicsWall", "Music", "Scene", "scene_music_association"]
