import { describe, it, expect } from 'vitest'

import { parseServerMessage } from '../../src/realtime/messages'

// The payload follows the API contract, whose fields are snake_case
const state = {
  active_adventure_id: 1, active_scene_id: 5, theme: 'tavern', wall_overlay: 'world',
}

describe('parseServerMessage', () => {
  it('parses a state snapshot', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'state', payload: state })))
      .toEqual({ type: 'state', payload: state })
  })

  it('accepts null for adventure and scene', () => {
    const empty = {
      active_adventure_id: null, active_scene_id: null, theme: 'dark', wall_overlay: 'off',
    }
    expect(parseServerMessage(JSON.stringify({ type: 'state', payload: empty })))
      .toEqual({ type: 'state', payload: empty })
  })

  it('keeps only the known fields of the payload', () => {
    const message = parseServerMessage(
      JSON.stringify({ type: 'state', payload: { ...state, extra: true } }),
    )
    expect(message).toEqual({ type: 'state', payload: state })
  })

  it('parses a ping', () => {
    expect(parseServerMessage('{"type":"ping"}')).toEqual({ type: 'ping' })
  })

  it('ignores unknown message types', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'mystery', payload: {} }))).toBeNull()
    expect(parseServerMessage(JSON.stringify({ payload: state }))).toBeNull()
  })

  it.each([
    ['a missing payload', { type: 'state' }],
    ['an unknown theme', { type: 'state', payload: { ...state, theme: 'light' } }],
    ['an unknown overlay', { type: 'state', payload: { ...state, wall_overlay: 'map' } }],
    ['a missing overlay', { type: 'state', payload: { ...state, wall_overlay: undefined } }],
    ['a missing field', { type: 'state', payload: { active_adventure_id: 1, theme: 'dark' } }],
    ['an ID as string', { type: 'state', payload: { ...state, active_scene_id: '5' } }],
    ['a fractional ID', { type: 'state', payload: { ...state, active_adventure_id: 1.5 } }],
    ['a payload that is a list', { type: 'state', payload: [1, 5, 'dark'] }],
  ])('rejects a state with %s', (_case, message) => {
    expect(parseServerMessage(JSON.stringify(message))).toBeNull()
  })

  it('rejects data that is not a JSON object', () => {
    expect(parseServerMessage('not json')).toBeNull()
    expect(parseServerMessage('null')).toBeNull()
    expect(parseServerMessage('[]')).toBeNull()
    expect(parseServerMessage(new ArrayBuffer(4))).toBeNull()
  })
})

const track = {
  id: 34, name: 'Forest', source: '/media/music/side/forest/From_Past_To_Present.mp3',
}
const audio = {
  playing: true, track, volume: 10, output_ready: false,
}

describe('parseServerMessage for audio', () => {
  it('parses an audio state', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'audio', payload: audio })))
      .toEqual({ type: 'audio', payload: audio })
  })

  it('accepts an audio state without track and the volume limits', () => {
    const volumeLimits = [0, 100]
    volumeLimits.forEach((volume) => {
      const payload = { ...audio, track: null, volume }
      expect(parseServerMessage(JSON.stringify({ type: 'audio', payload })))
        .toEqual({ type: 'audio', payload })
    })
  })

  it('keeps only the known fields of the audio state and the track', () => {
    const payload = { ...audio, extra: 1, track: { ...track, extra: 2 } }
    expect(parseServerMessage(JSON.stringify({ type: 'audio', payload })))
      .toEqual({ type: 'audio', payload: audio })
  })

  it.each([
    ['a missing payload', { type: 'audio' }],
    ['playing as string', { type: 'audio', payload: { ...audio, playing: 'true' } }],
    ['a missing output_ready', { type: 'audio', payload: { playing: true, track, volume: 10 } }],
    ['a volume below 0', { type: 'audio', payload: { ...audio, volume: -1 } }],
    ['a volume above 100', { type: 'audio', payload: { ...audio, volume: 101 } }],
    ['a fractional volume', { type: 'audio', payload: { ...audio, volume: 0.5 } }],
    [
      'a missing track',
      { type: 'audio', payload: { playing: true, volume: 10, output_ready: true } },
    ],
    [
      'a track without source',
      { type: 'audio', payload: { ...audio, track: { id: 1, name: 'x' } } },
    ],
    [
      'a track ID as string',
      { type: 'audio', payload: { ...audio, track: { ...track, id: '34' } } },
    ],
  ])('rejects an audio state with %s', (_case, message) => {
    expect(parseServerMessage(JSON.stringify(message))).toBeNull()
  })

  it('parses audio_output', () => {
    const activeValues = [true, false]
    activeValues.forEach((active) => {
      expect(parseServerMessage(JSON.stringify({ type: 'audio_output', payload: { active } })))
        .toEqual({
          type: 'audio_output',
          payload: { active },
        })
    })
  })

  it.each([
    ['a missing payload', { type: 'audio_output' }],
    ['active as string', { type: 'audio_output', payload: { active: 'true' } }],
  ])('rejects audio_output with %s', (_case, message) => {
    expect(parseServerMessage(JSON.stringify(message))).toBeNull()
  })

  it('parses a sound effect', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'sound', payload: { name: 'heal' } })))
      .toEqual({
        type: 'sound',
        payload: { name: 'heal' },
      })
  })

  it.each([
    ['an unknown name', { type: 'sound', payload: { name: 'explosion' } }],
    ['a missing name', { type: 'sound', payload: {} }],
    ['a missing payload', { type: 'sound' }],
  ])('rejects a sound effect with %s', (_case, message) => {
    expect(parseServerMessage(JSON.stringify(message))).toBeNull()
  })
})

describe('parseServerMessage for screens', () => {
  const screens = { wall: 1, ground: 0, player: 2 }

  it('parses the number of connected screens', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'screens', payload: screens })))
      .toEqual({ type: 'screens', payload: screens })
  })

  it('keeps only the known counts', () => {
    const payload = { ...screens, admin: 3 }
    expect(parseServerMessage(JSON.stringify({ type: 'screens', payload })))
      .toEqual({ type: 'screens', payload: screens })
  })

  it.each([
    ['a missing payload', { type: 'screens' }],
    ['a missing count', { type: 'screens', payload: { wall: 1, ground: 0 } }],
    ['a negative count', { type: 'screens', payload: { ...screens, wall: -1 } }],
    ['a fractional count', { type: 'screens', payload: { ...screens, player: 1.5 } }],
    ['a count as string', { type: 'screens', payload: { ...screens, ground: '1' } }],
  ])('rejects screens with %s', (_case, message) => {
    expect(parseServerMessage(JSON.stringify(message))).toBeNull()
  })
})
