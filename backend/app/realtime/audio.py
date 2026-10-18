import random
from collections.abc import Callable

from app.realtime.manager import Connection
from app.schemas import AudioState, AudioUpdate, Track
from app.schemas.audio import DEFAULT_VOLUME


class AudioService:
    """Music state of the game table, kept in memory of the API process (paused again after a restart).

    The server decides about the music; the Wall that is the audio output only plays it. Changes are made under
    `manager.state_lock` (app/realtime/push.py), so they are sent in the order they happened.
    """

    def __init__(self, choose: Callable[[], float] = random.random) -> None:
        # Random source in [0, 1), injectable for tests
        self.random = choose
        self.scene_id: int | None = None
        self.playlist: list[Track] = []
        self.track: Track | None = None
        self.playing = False
        self.volume = DEFAULT_VOLUME
        self.output: Connection | None = None

    def reset(self, scene_id: int | None, playlist: list[Track]) -> None:
        """Start state: paused, default volume, no output, a random track of the playlist."""
        self.playing = False
        self.volume = DEFAULT_VOLUME
        self.output = None
        self.set_playlist(scene_id, playlist)

    def state(self) -> AudioState:
        return AudioState(
            playing=self.playing, track=self.track, volume=self.volume, output_ready=self.output is not None
        )

    def set_playlist(self, scene_id: int | None, playlist: list[Track]) -> None:
        """Playlist of a newly active scene (or the default music); `playing` stays as it is."""
        self.scene_id = scene_id
        self.playlist = list(playlist)
        self.track = self._choose(self.playlist)

    def update(self, update: AudioUpdate) -> None:
        values = update.model_dump(exclude_unset=True)
        if "volume" in values:
            self.volume = values["volume"]
        if "playing" in values and (self.track is not None or not values["playing"]):
            self.playing = values["playing"]

    def next(self) -> None:
        """Another random track of the playlist (if possible not the current one); `playing` stays as it is."""
        current = self.track
        others = [track for track in self.playlist if current is None or track.id != current.id]
        self.track = self._choose(others or self.playlist)

    def set_output(self, connection: Connection) -> Connection | None:
        """Makes the connection the audio output; returns the previous output (if it was another connection)."""
        previous = self.output
        self.output = connection
        return previous if previous is not connection else None

    def release_output(self, connection: Connection) -> bool:
        """True if the connection was the output and no longer is."""
        if self.output is not connection:
            return False
        self.output = None
        return True

    def track_ended(self, connection: Connection, track_id: int) -> bool:
        """Next track if the output reports the end of the current track; False for outdated or duplicate reports."""
        if self.output is not connection or self.track is None or self.track.id != track_id:
            return False
        self.next()
        return True

    def _choose(self, tracks: list[Track]) -> Track | None:
        if not tracks:
            return None
        return tracks[min(int(self.random() * len(tracks)), len(tracks) - 1)]


audio = AudioService()
