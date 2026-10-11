from pydantic import BaseModel, ConfigDict


class Image(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    source: str


class Track(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    source: str


class SceneDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    main: bool
    wall_image: Image
    ground_image: Image
    tracks: list[Track]
