import { describe, it, expect } from 'vitest'

import { parseServerMessage } from '../../src/realtime/messages'

// The payload follows the API contract, whose fields are snake_case
/* eslint-disable camelcase */
const state = { active_adventure_id: 1, active_scene_id: 5, theme: 'tavern' }

describe('parseServerMessage', () => {
  it('parses a state snapshot', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'state', payload: state }))).toEqual({ type: 'state', payload: state })
  })

  it('accepts null for adventure and scene', () => {
    const empty = { active_adventure_id: null, active_scene_id: null, theme: 'dark' }
    expect(parseServerMessage(JSON.stringify({ type: 'state', payload: empty }))).toEqual({ type: 'state', payload: empty })
  })

  it('keeps only the known fields of the payload', () => {
    const message = parseServerMessage(JSON.stringify({ type: 'state', payload: { ...state, extra: true } }))
    expect(message).toEqual({ type: 'state', payload: state })
  })

  it('parses a ping', () => {
    expect(parseServerMessage('{"type":"ping"}')).toEqual({ type: 'ping' })
  })

  it('ignores unknown message types', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'audio', payload: {} }))).toBeNull()
    expect(parseServerMessage(JSON.stringify({ payload: state }))).toBeNull()
  })

  it.each([
    ['a missing payload', { type: 'state' }],
    ['an unknown theme', { type: 'state', payload: { ...state, theme: 'light' } }],
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
