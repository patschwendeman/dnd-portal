from pydantic import BaseModel, ConfigDict


class MapEntry(BaseModel):
    """A tile in the map overviews: `id` is the scene ID, `source` its ground (Kampfszene) or wall image."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
