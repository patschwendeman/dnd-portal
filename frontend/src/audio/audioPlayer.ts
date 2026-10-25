import { soundFile } from './sounds'
import { mediaUrl } from '../api/mediaUrl'
import { AudioState, SoundName } from '../models/models'

// The part of HTMLAudioElement used here, so tests can pass a fake
export interface PlayableAudio {
  src: string
  currentTime: number
  loop: boolean
  volume: number
  readonly paused: boolean
  onended: ((event: Event) => void) | null
  play: () => Promise<void>
  pause: () => void
}

export interface AudioPlayerOptions {
  onTrackEnded: (trackId: number) => void
  createAudio?: () => PlayableAudio
  resolveSource?: (source: string) => string
}

const SOUND_VOLUME = 1

const startPlayback = (audio: PlayableAudio): void => {
  // e.g. playback blocked by the browser: only logged, the next play command tries again
  audio.play().catch((error: unknown) => console.error('Error playing audio:', error))
}

export class AudioPlayer {
  private readonly music: PlayableAudio

  private readonly createAudio: () => PlayableAudio

  private readonly resolveSource: (source: string) => string

  private readonly onTrackEnded: (trackId: number) => void

  private active = false

  private trackId: number | null = null

  constructor({
    onTrackEnded,
    createAudio = () => new Audio(),
    resolveSource = mediaUrl,
  }: AudioPlayerOptions) {
    this.createAudio = createAudio
    this.resolveSource = resolveSource
    this.onTrackEnded = onTrackEnded
    this.music = createAudio()
    this.music.loop = false
    this.music.onended = () => {
      if (this.active && this.trackId !== null) {
        this.onTrackEnded(this.trackId)
      }
    }
  }

  // Applies the state of the server; without the role (or without a state) the music is paused at
  // once
  update(state: AudioState | null, active: boolean): void {
    const becameActive = active && !this.active
    this.active = active
    if (!active || state === null) {
      this.music.pause()
      return
    }
    this.music.volume = state.volume / 100

    const { track } = state
    if (track === null) {
      this.trackId = null
      this.music.pause()
      return
    }
    // A new output starts the current track from the beginning
    const trackChanged = becameActive || track.id !== this.trackId
    if (trackChanged) {
      this.trackId = track.id
      this.music.src = this.resolveSource(track.source)
      this.music.currentTime = 0
    }

    if (!state.playing) {
      this.music.pause()
    } else if (trackChanged || this.music.paused) {
      startPlayback(this.music)
    }
  }

  playSound(name: SoundName): void {
    const file = soundFile(name)
    if (!this.active || file === undefined) {
      return
    }
    const sound = this.createAudio()
    sound.loop = false
    sound.volume = SOUND_VOLUME
    sound.src = file
    startPlayback(sound)
  }

  dispose(): void {
    this.active = false
    this.music.onended = null
    this.music.pause()
  }
}
