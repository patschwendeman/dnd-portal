import { describe, it, expect, beforeEach } from 'vitest'

import { MusicAudio, MusicPlayer } from '../../src/utils/musicPlayer'

class FakeAudio implements MusicAudio {
  src = ''
  currentTime = 0
  loop = true
  volume = 1
  onended: ((event: Event) => void) | null = null
  paused = true
  playCalls = 0
  failPlay = false

  play(): Promise<void> {
    this.playCalls++
    if (this.failPlay) {
      this.paused = true
      return Promise.reject(new Error('NotAllowedError'))
    }
    this.paused = false
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }

  end(): void {
    this.paused = true
    this.onended?.(new Event('ended'))
  }
}

// Deterministic replacement for Math.random: cycles through the given values
const sequence = (values: number[]): (() => number) => {
  let index = 0
  return () => values[index++ % values.length]
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

const oldPlaylist = ['/old/a.mp3', '/old/b.mp3', '/old/c.mp3']
const newPlaylist = ['/new/x.mp3', '/new/y.mp3', '/new/z.mp3']

describe('MusicPlayer', () => {
  let audio: FakeAudio
  let player: MusicPlayer

  beforeEach(() => {
    audio = new FakeAudio()
    player = new MusicPlayer(() => audio, sequence([0, 0.4, 0.8, 0.1, 0.5, 0.9]))
  })

  it('should configure a single audio element with volume 0.1 and without loop', () => {
    expect(audio.volume).toBe(0.1)
    expect(audio.loop).toBe(false)
  })

  describe('scene change', () => {
    it('should pick a track from the new playlist and keep playing', async () => {
      player.setPlaylist(oldPlaylist)
      await player.play()
      const previousTrack = player.track

      player.setPlaylist(newPlaylist)
      await flush()

      expect(newPlaylist).toContain(player.track)
      expect(player.track).not.toBe(previousTrack)
      expect(audio.src).toBe(player.track)
      expect(player.isPlaying).toBe(true)
      expect(audio.paused).toBe(false)
    })

    it('should pick a different track when the new playlist contains the current one', async () => {
      player.setPlaylist(oldPlaylist)
      await player.play()
      const previousTrack = player.track as string

      player.setPlaylist([previousTrack, ...newPlaylist])
      await flush()

      expect(player.track).not.toBe(previousTrack)
      expect(audio.src).toBe(player.track)
    })

    it('should stay paused but show the new track when music was paused', () => {
      player.setPlaylist(oldPlaylist)
      const previousTrack = player.track

      player.setPlaylist(newPlaylist)

      expect(newPlaylist).toContain(player.track)
      expect(player.track).not.toBe(previousTrack)
      expect(audio.src).toBe(player.track)
      expect(player.isPlaying).toBe(false)
      expect(audio.paused).toBe(true)
    })
  })

  describe('track end', () => {
    it('should play another track of the same playlist', async () => {
      player.setPlaylist(oldPlaylist)
      await player.play()
      const finishedTrack = player.track

      audio.end()
      await flush()

      expect(oldPlaylist).toContain(player.track)
      expect(player.track).not.toBe(finishedTrack)
      expect(audio.src).toBe(player.track)
      expect(player.isPlaying).toBe(true)
      expect(audio.paused).toBe(false)
    })

    it('should take the next track from a playlist changed in between', async () => {
      player.setPlaylist(oldPlaylist)
      await player.play()
      player.setPlaylist(newPlaylist)
      await flush()

      audio.end()
      await flush()

      expect(newPlaylist).toContain(player.track)
      expect(audio.src).toBe(player.track)
      expect(audio.paused).toBe(false)
    })

    it('should replay the only track of a single-track playlist', async () => {
      player.setPlaylist(['/single/only.mp3'])
      await player.play()
      audio.currentTime = 120
      const playCallsBefore = audio.playCalls

      audio.end()
      await flush()

      expect(player.track).toBe('/single/only.mp3')
      expect(audio.src).toBe('/single/only.mp3')
      expect(audio.currentTime).toBe(0)
      expect(audio.playCalls).toBe(playCallsBefore + 1)
      expect(audio.paused).toBe(false)
      expect(player.isPlaying).toBe(true)
    })
  })

  describe('play and pause', () => {
    it('should toggle between playing and paused', async () => {
      player.setPlaylist(oldPlaylist)

      await player.toggle()
      expect(player.isPlaying).toBe(true)
      expect(audio.paused).toBe(false)

      await player.toggle()
      expect(player.isPlaying).toBe(false)
      expect(audio.paused).toBe(true)
    })

    it('should stay paused without throwing when play fails', async () => {
      player.setPlaylist(oldPlaylist)
      audio.failPlay = true

      await expect(player.play()).resolves.toBeUndefined()

      expect(player.isPlaying).toBe(false)
    })

    it('should notify listeners about track and play state', async () => {
      const states: Array<{ track: string | null; isPlaying: boolean }> = []
      player.subscribe(() => states.push({ track: player.track, isPlaying: player.isPlaying }))

      player.setPlaylist(oldPlaylist)
      await player.play()

      expect(states.at(-1)).toEqual({ track: audio.src, isPlaying: true })
    })
  })

  describe('empty playlist', () => {
    it('should pause and have no track', async () => {
      player.setPlaylist(oldPlaylist)
      await player.play()

      player.setPlaylist([])

      expect(player.track).toBeNull()
      expect(player.isPlaying).toBe(false)
      expect(audio.paused).toBe(true)
    })

    it('should not start playing without a track', async () => {
      player.setPlaylist([])

      await player.play()

      expect(player.isPlaying).toBe(false)
      expect(audio.playCalls).toBe(0)
    })
  })
})
