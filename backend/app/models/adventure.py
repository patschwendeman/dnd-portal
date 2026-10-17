from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.player import Player
    from app.models.scene import Scene


class Adventure(Base):
    """Top level: bundles scenes and players and stores the active scene and the global level persistently."""

    __tablename__ = "adventure"
    __table_args__ = (CheckConstraint("global_level BETWEEN 1 AND 20", name="global_level"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str | None] = mapped_column(Text)
    global_level: Mapped[int] = mapped_column(default=1, server_default="1")
    # adventure <-> scene is circular: the FK is created after scene.adventure_id (use_alter), rows are written
    # in two steps (post_update).
    active_scene_id: Mapped[int | None] = mapped_column(ForeignKey("scene.id", ondelete="SET NULL", use_alter=True))
    active_scene: Mapped["Scene | None"] = relationship(foreign_keys=[active_scene_id], post_update=True)
    scenes: Mapped[list["Scene"]] = relationship(
        back_populates="adventure", foreign_keys="Scene.adventure_id", order_by="Scene.id"
    )
    players: Mapped[list["Player"]] = relationship(back_populates="adventure", order_by="Player.id")
