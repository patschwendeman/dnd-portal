import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { PlayableAudio, WallAudioPlayer } from '../../src/audio/wallAudioPlayer'
import { AudioState } from '../../src/models/models'

class FakeAudio implements PlayableAudio {
  src = ''
  currentTime = 0
  loop = true
  volume = 1
  paused = true
  onended: ((event: Event) => void) | null = null
  playCalls = 0
  rejectPlay = false

  play() {
    this.playCalls += 1
    if (this.rejectPlay) {
      return Promise.reject(new Error('NotAllowedError'))
    }
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  end() {
    this.paused = true
    this.onended?.(new Event('ended'))
  }
}

const first = { id: 1, name: 'First', source: '/media/music/first.mp3' }
const second = { id: 2, name: 'Second', source: '/media/music/second.mp3' }
// The payload follows the API contract, whose fields are snake_case
// eslint-disable-next-line camelcase
const playing: AudioState = { playing: true, track: first, volume: 40, output_ready: true }
const paused: AudioState = { ...playing, playing: false }

let audios: FakeAudio[]
let ended: number[]
let player: WallAudioPlayer

const music = () => audios[0]

beforeEach(() => {
  audios = []
  ended = []
  player = new WallAudioPlayer({
    onTrackEnded: (trackId) => ended.push(trackId),
    createAudio: () => {
      const audio = new FakeAudio()
      audios.push(audio)
      return audio
    },
    resolveSource: (source) => `http://api${source}`,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WallAudioPlayer', () => {
  it('plays nothing while it is not the audio output', () => {
    player.update(playing, false)
    player.playSound('heal')

    expect(music().playCalls).toBe(0)
    expect(music().src).toBe('')
    expect(audios).toHaveLength(1)
  })

  it('starts the current track from the beginning when it becomes the output', () => {
    player.update(playing, true)

    expect(music().src).toBe('http://api/media/music/first.mp3')
    expect(music().currentTime).toBe(0)
    expect(music().loop).toBe(false)
    expect(music().volume).toBe(0.4)
    expect(music().playCalls).toBe(1)
  })

  it('follows play and pause of the server', () => {
    player.update(paused, true)
    expect(music().playCalls).toBe(0)
    expect(music().src).toBe('http://api/media/music/first.mp3')

    player.update(playing, true)
    expect(music().paused).toBe(false)
    music().currentTime = 12

    player.update(paused, true)
    expect(music().paused).toBe(true)

    // Resumes where it was paused, the track did not change
    player.update(playing, true)
    expect(music().paused).toBe(false)
    expect(music().currentTime).toBe(12)
    expect(music().playCalls).toBe(2)
  })

  it('does not restart a playing track for an unchanged state', () => {
    player.update(playing, true)
    music().currentTime = 30

    player.update({ ...playing }, true)

    expect(music().playCalls).toBe(1)
    expect(music().currentTime).toBe(30)
  })

  it('switches the track and the volume', () => {
    player.update(playing, true)
    music().currentTime = 50

    player.update({ ...playing, track: second, volume: 100 }, true)

    expect(music().src).toBe('http://api/media/music/second.mp3')
    expect(music().currentTime).toBe(0)
    expect(music().volume).toBe(1)
    expect(music().playCalls).toBe(2)

    player.update({ ...playing, track: second, volume: 0 }, true)
    expect(music().volume).toBe(0)
  })

  it('reports the end of the current track only while it is the output', () => {
    player.update(playing, true)
    music().end()
    expect(ended).toEqual([1])

    player.update({ ...playing, track: second }, true)
    music().end()
    expect(ended).toEqual([1, 2])

    player.update({ ...playing, track: second }, false)
    music().end()
    expect(ended).toEqual([1, 2])
  })

  it('plays the same track again after its end when the server keeps it', () => {
    player.update(playing, true)
    music().end()

    player.update({ ...playing }, true)

    expect(music().playCalls).toBe(2)
    expect(music().paused).toBe(false)
  })

  it('pauses at once when it loses the role and restarts the track when it gets it back', () => {
    player.update(playing, true)
    music().currentTime = 20

    player.update(playing, false)
    expect(music().paused).toBe(true)

    player.update(playing, true)
    expect(music().currentTime).toBe(0)
    expect(music().paused).toBe(false)
  })

  it('pauses without a track', () => {
    player.update(playing, true)

    player.update({ ...playing, track: null }, true)

    expect(music().paused).toBe(true)
  })

  it('does not throw when play() is rejected and tries again on the next state', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    music().rejectPlay = true

    expect(() => player.update(playing, true)).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    expect(error).toHaveBeenCalledTimes(1)

    music().rejectPlay = false
    player.update({ ...playing }, true)
    expect(music().playCalls).toBe(2)
    expect(music().paused).toBe(false)
  })

  it('plays sound effects at full volume on top of the music', () => {
    player.update(playing, true)

    player.playSound('heal')
    player.playSound('debuff_1')

    expect(audios).toHaveLength(3)
    expect(audios[1].src).toBe('/assets/sounds/heal.wav')
    expect(audios[1].volume).toBe(1)
    expect(audios[1].loop).toBe(false)
    expect(audios[1].playCalls).toBe(1)
    expect(audios[2].src).toBe('/assets/sounds/debuff_1.mp3')
    expect(music().paused).toBe(false)
  })

  it('stops on dispose', () => {
    player.update(playing, true)

    player.dispose()
    music().end()

    expect(music().paused).toBe(true)
    expect(ended).toEqual([])
  })
})
