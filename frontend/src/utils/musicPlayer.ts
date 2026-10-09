import { getRandomTrack } from './utils'

// Subset of HTMLAudioElement used by the player, so tests can inject a fake without a browser
export interface MusicAudio {
  src: string
  currentTime: number
  loop: boolean
  volume: number
  onended: ((event: Event) => void) | null
  play: () => Promise<void>
  pause: () => void
}

type Listener = () => void

const MUSIC_VOLUME = 0.1

// Holds the whole music state (playlist, current track, play state) in one place, so the displayed
// track is always the one loaded into the single audio element and track end never depends on stale React state
export class MusicPlayer {
  private readonly audio: MusicAudio
  private readonly random: () => number
  private readonly listeners = new Set<Listener>()
  private playlist: string[] = []
  private currentTrack: string | null = null
  private playing = false
  // Invalidates pending play() promises after pause or a newer play request
  private playRequest = 0

  constructor(
    createAudio: () => MusicAudio = () => new Audio(),
    random: () => number = Math.random
  ) {
    this.audio = createAudio()
    this.audio.loop = false
    this.audio.volume = MUSIC_VOLUME
    this.audio.onended = () => this.handleEnded()
    this.random = random
  }

  get track(): string | null {
    return this.currentTrack
  }

  get isPlaying(): boolean {
    return this.playing
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setPlaylist(tracks: string[]): void {
    this.playlist = [...tracks]
    if (this.playlist.length === 0) {
      this.playRequest++
      this.audio.pause()
      this.currentTrack = null
      this.playing = false
      this.notify()
      return
    }
    this.loadNextTrack()
    if (this.playing) {
      void this.startAudio()
    }
    this.notify()
  }

  async play(): Promise<void> {
    if (this.currentTrack === null) {
      return
    }
    await this.startAudio()
  }

  pause(): void {
    this.playRequest++
    this.audio.pause()
    if (this.playing) {
      this.playing = false
      this.notify()
    }
  }

  async toggle(): Promise<void> {
    if (this.playing) {
      this.pause()
      return
    }
    await this.play()
  }

  private handleEnded(): void {
    if (this.playlist.length === 0) {
      return
    }
    this.loadNextTrack()
    this.notify()
    void this.startAudio()
  }

  private loadNextTrack(): void {
    const nextTrack = getRandomTrack(this.playlist, this.currentTrack ?? '', this.random)
    this.currentTrack = nextTrack
    this.audio.src = nextTrack
    this.audio.currentTime = 0
  }

  private async startAudio(): Promise<void> {
    const request = ++this.playRequest
    try {
      await this.audio.play()
      if (request === this.playRequest && !this.playing) {
        this.playing = true
        this.notify()
      }
    } catch {
      // e.g. autoplay blocked: show the music as paused instead of raising an unhandled rejection
      if (request === this.playRequest && this.playing) {
        this.playing = false
        this.notify()
      }
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }
}
