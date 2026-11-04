from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

CombatantKind = Literal["player", "enemy", "ally"]
MIN_NUMBER = 1
MAX_NUMBER = 99
MAX_LABEL_LENGTH = 60


class Combatant(BaseModel):
    """A participant of the fight: a player (`player_id`) or an NPC (`enemy`/`ally`) with the `number` of its figure on
    the table and an optional `label` that only the Admin shows."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: CombatantKind
    player_id: int | None
    number: int | None
    label: str | None
    defeated: bool


class FightState(BaseModel):
    """The running fight of the active adventure; `combatants` in initiative order, `null` turn: nobody is left."""

    model_config = ConfigDict(from_attributes=True)

    round: int
    active_combatant_id: int | None
    scene_id: int
    combatants: list[Combatant]


class CombatantCreate(BaseModel):
    """A player (`player_id`, nothing else) or an NPC (`number`, optional `label`; trimmed, empty = none)."""

    kind: CombatantKind
    player_id: int | None = None
    number: int | None = Field(default=None, ge=MIN_NUMBER, le=MAX_NUMBER)
    label: Annotated[str, StringConstraints(strip_whitespace=True, max_length=MAX_LABEL_LENGTH)] | None = None

    @field_validator("label")
    @classmethod
    def _empty_label_is_none(cls, label: str | None) -> str | None:
        return label or None

    @model_validator(mode="after")
    def _fields_match_kind(self) -> Self:
        if self.kind == "player":
            if self.player_id is None or self.number is not None or self.label is not None:
                raise ValueError("A player needs player_id and neither number nor label")
        elif self.number is None or self.player_id is not None:
            raise ValueError("An enemy or ally needs a number and no player_id")
        return self


class FightStart(BaseModel):
    combatants: list[CombatantCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def _no_duplicates(self) -> Self:
        player_ids = [c.player_id for c in self.combatants if c.player_id is not None]
        numbers = [c.number for c in self.combatants if c.number is not None]
        if len(set(player_ids)) != len(player_ids):
            raise ValueError("Duplicate player")
        if len(set(numbers)) != len(numbers):
            raise ValueError("Duplicate number")
        return self


class TurnRequest(BaseModel):
    """Ends the turn of `from_combatant_id`; if it is no longer the turn of that combatant, nothing changes."""

    from_combatant_id: int


class CombatantUpdate(BaseModel):
    defeated: bool


class FightOrder(BaseModel):
    """The new initiative order: exactly the IDs of the current combatants."""

    combatant_ids: list[int]
