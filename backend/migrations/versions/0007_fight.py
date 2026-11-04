"""fight: running fight per adventure with its combatants

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-04 19:51:54.428637

Adds the tables `fight` (at most one per adventure, with the scene it started in, the round and the combatant whose
turn it is) and `combatant` (players and NPCs in initiative order). Existing data is not touched; the seeder creates
no fight. The FK `fight.active_combatant_id` -> `combatant.id` is created last because of the circular reference
fight <-> combatant. The downgrade drops both tables.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | Sequence[str] | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "fight",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("adventure_id", sa.Integer(), nullable=False),
        sa.Column("scene_id", sa.Integer(), nullable=False),
        sa.Column("round", sa.Integer(), server_default="1", nullable=False),
        sa.Column("active_combatant_id", sa.Integer(), nullable=True),
        sa.CheckConstraint("round >= 1", name=op.f("ck_fight_round")),
        sa.ForeignKeyConstraint(
            ["adventure_id"], ["adventure.id"], name=op.f("fk_fight_adventure_id_adventure"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["scene_id"], ["scene.id"], name=op.f("fk_fight_scene_id_scene"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fight")),
        sa.UniqueConstraint("adventure_id", name=op.f("uq_fight_adventure_id")),
    )
    op.create_table(
        "combatant",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("fight_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=True),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("label", sa.Text(), nullable=True),
        sa.Column("defeated", sa.Boolean(), server_default="false", nullable=False),
        sa.CheckConstraint(
            "(kind = 'player') = (player_id IS NOT NULL) AND (player_id IS NOT NULL) = (number IS NULL)",
            name=op.f("ck_combatant_kind_fields"),
        ),
        sa.CheckConstraint("kind <> 'player' OR label IS NULL", name=op.f("ck_combatant_label")),
        sa.CheckConstraint("kind IN ('player', 'enemy', 'ally')", name=op.f("ck_combatant_kind")),
        sa.CheckConstraint("number BETWEEN 1 AND 99", name=op.f("ck_combatant_number")),
        sa.ForeignKeyConstraint(
            ["fight_id"], ["fight.id"], name=op.f("fk_combatant_fight_id_fight"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["player_id"], ["player.id"], name=op.f("fk_combatant_player_id_player"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_combatant")),
        sa.UniqueConstraint("fight_id", "number", name=op.f("uq_combatant_fight_id_number")),
        sa.UniqueConstraint("fight_id", "player_id", name=op.f("uq_combatant_fight_id_player_id")),
        sa.UniqueConstraint(
            "fight_id",
            "position",
            deferrable=True,
            initially="DEFERRED",
            name=op.f("uq_combatant_fight_id_position"),
        ),
    )
    op.create_foreign_key(
        op.f("fk_fight_active_combatant_id_combatant"),
        "fight",
        "combatant",
        ["active_combatant_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_fight_active_combatant_id_combatant"), "fight", type_="foreignkey")
    op.drop_table("combatant")
    op.drop_table("fight")
