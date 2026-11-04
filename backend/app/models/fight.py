from sqlalchemy import CheckConstraint, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Fight(Base):
    """The running fight of an adventure (at most one), with the scene it started in, the round and whose turn it is."""

    __tablename__ = "fight"
    __table_args__ = (CheckConstraint("round >= 1", name="round"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    adventure_id: Mapped[int] = mapped_column(ForeignKey("adventure.id", ondelete="CASCADE"), unique=True)
    scene_id: Mapped[int] = mapped_column(ForeignKey("scene.id", ondelete="CASCADE"))
    round: Mapped[int] = mapped_column(default=1, server_default="1")
    # fight <-> combatant is circular: the FK is created after combatant.fight_id (use_alter); the service sets it after
    # the combatants are flushed. A turn is a combatant, not an index, so that reordering and removing keep it.
    active_combatant_id: Mapped[int | None] = mapped_column(
        ForeignKey("combatant.id", ondelete="SET NULL", use_alter=True)
    )
    combatants: Mapped[list["Combatant"]] = relationship(
        back_populates="fight",
        foreign_keys="Combatant.fight_id",
        order_by="Combatant.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Combatant(Base):
    """A participant of a fight: a player of the adventure, or an enemy or ally (NPC) with the number of its figure."""

    __tablename__ = "combatant"
    __table_args__ = (
        # Deferred: reordering swaps positions within one transaction.
        UniqueConstraint(
            "fight_id", "position", name="uq_combatant_fight_id_position", deferrable=True, initially="DEFERRED"
        ),
        UniqueConstraint("fight_id", "player_id", name="uq_combatant_fight_id_player_id"),
        UniqueConstraint("fight_id", "number", name="uq_combatant_fight_id_number"),
        CheckConstraint("kind IN ('player', 'enemy', 'ally')", name="kind"),
        CheckConstraint("number BETWEEN 1 AND 99", name="number"),
        CheckConstraint(
            "(kind = 'player') = (player_id IS NOT NULL) AND (player_id IS NOT NULL) = (number IS NULL)",
            name="kind_fields",
        ),
        CheckConstraint("kind <> 'player' OR label IS NULL", name="label"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    fight_id: Mapped[int] = mapped_column(ForeignKey("fight.id", ondelete="CASCADE"))
    fight: Mapped[Fight] = relationship(back_populates="combatants", foreign_keys=[fight_id])
    # Initiative order within the fight; gaps are allowed.
    position: Mapped[int]
    kind: Mapped[str] = mapped_column(Text)
    player_id: Mapped[int | None] = mapped_column(ForeignKey("player.id", ondelete="CASCADE"))
    # Number of the figure on the table, shared by enemies and allies; NPCs only.
    number: Mapped[int | None]
    # Only the Admin sees it; NPCs only.
    label: Mapped[str | None] = mapped_column(Text)
    defeated: Mapped[bool] = mapped_column(default=False, server_default="false")
