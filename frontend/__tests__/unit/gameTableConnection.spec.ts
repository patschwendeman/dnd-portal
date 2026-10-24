import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'

import {
  ConnectionStatus, createGameTableConnection, SocketLike,
} from '../../src/realtime/connection'
import { VisibilitySource } from '../../src/realtime/visibility'

// The payload follows the API contract, whose fields are snake_case
const state = {
  active_adventure_id: 1, active_scene_id: 5, theme: 'dark', wall_overlay: 'off',
}

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null

  onmessage: ((event: { data: unknown }) => void) | null = null

  onclose: (() => void) | null = null

  closed = false

  sent: string[] = []

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
  }

  receive(message: object) {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

let sockets: FakeSocket[]
let statuses: ConnectionStatus[]
let states: unknown[]
let messages: unknown[]

interface FakeVisibility extends VisibilitySource {
  listeners: Set<() => void>
  change: (visible: boolean) => void
}

const createFakeVisibility = (): FakeVisibility => {
  let visible = true
  const listeners = new Set<() => void>()
  return {
    listeners,
    isVisible: () => visible,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    change: (next) => {
      visible = next
      listeners.forEach((listener) => listener())
    },
  }
}

const connect = (
  heartbeatTimeoutMs = 35000,
  visibility: VisibilitySource = createFakeVisibility(),
) => createGameTableConnection({
  url: 'ws://localhost/ws?screen=wall',
  onState: (payload) => states.push(payload),
  onMessage: (message) => messages.push(message),
  onStatus: (status) => statuses.push(status),
  createSocket: () => {
    const socket = new FakeSocket()
    sockets.push(socket)
    return socket
  },
  heartbeatTimeoutMs,
  visibility,
})

const latest = () => sockets[sockets.length - 1]

beforeEach(() => {
  vi.useFakeTimers()
  sockets = []
  statuses = []
  states = []
  messages = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createGameTableConnection', () => {
  it('connects at once and passes state snapshots on', () => {
    connect()
    latest().onopen?.()
    latest().receive({ type: 'state', payload: state })
    latest().receive({ type: 'ping' })
    latest().receive({ type: 'unknown' })

    expect(sockets).toHaveLength(1)
    expect(statuses).toEqual(['connecting', 'open'])
    expect(states).toEqual([state])
    expect(messages).toEqual([])
  })

  it('passes the other messages on', () => {
    connect()
    latest().onopen?.()
    const audio = {
      playing: false, track: null, volume: 10, output_ready: true,
    }
    latest().receive({ type: 'audio', payload: audio })
    latest().receive({ type: 'audio_output', payload: { active: true } })
    latest().receive({ type: 'sound', payload: { name: 'lock' } })
    latest().receive({ type: 'sound', payload: { name: 'unknown' } })

    expect(messages).toEqual([
      { type: 'audio', payload: audio },
      { type: 'audio_output', payload: { active: true } },
      { type: 'sound', payload: { name: 'lock' } },
    ])
    expect(states).toEqual([])
  })

  it('sends only over an open connection', () => {
    const connection = connect()
    expect(connection.send({ type: 'audio_ready' })).toBe(false)

    latest().onopen?.()
    expect(connection.send({ type: 'track_ended', payload: { track_id: 7 } })).toBe(true)
    expect(latest().sent).toEqual(['{"type":"track_ended","payload":{"track_id":7}}'])

    latest().onclose?.()
    expect(connection.send({ type: 'audio_ready' })).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(connection.send({ type: 'audio_ready' })).toBe(false)
    latest().onopen?.()
    expect(connection.send({ type: 'audio_ready' })).toBe(true)

    expect(sockets[0].sent).toHaveLength(1)
    expect(sockets[1].sent).toEqual(['{"type":"audio_ready"}'])
  })

  it('reconnects with growing delay and resets it after a successful connect', () => {
    connect()
    latest().onclose?.()
    expect(statuses).toEqual(['connecting', 'closed'])

    vi.advanceTimersByTime(999)
    expect(sockets).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(sockets).toHaveLength(2)

    latest().onclose?.()
    vi.advanceTimersByTime(1999)
    expect(sockets).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(sockets).toHaveLength(3)

    latest().onopen?.()
    latest().onclose?.()
    vi.advanceTimersByTime(1000)
    expect(sockets).toHaveLength(4)
    expect(statuses).toEqual(['connecting', 'closed', 'closed', 'open', 'closed'])
  })

  it('closes and reconnects when no message arrives within the heartbeat timeout', () => {
    connect(1000)
    latest().onopen?.()
    vi.advanceTimersByTime(900)
    latest().receive({ type: 'ping' })
    vi.advanceTimersByTime(900)
    expect(sockets[0].closed).toBe(false)

    vi.advanceTimersByTime(100)
    expect(sockets[0].closed).toBe(true)
    expect(statuses[statuses.length - 1]).toBe('closed')

    vi.advanceTimersByTime(1000)
    expect(sockets).toHaveLength(2)
  })

  it('ignores events of a dropped socket', () => {
    const connection = connect()
    const old = latest()
    const oldOnState = old.onmessage

    connection.reconnectNow()
    oldOnState?.({ data: JSON.stringify({ type: 'state', payload: state }) })

    expect(old.closed).toBe(true)
    expect(old.onmessage).toBeNull()
    expect(old.onclose).toBeNull()
    expect(sockets).toHaveLength(2)
  })

  it('reconnects at once on request instead of waiting for the backoff', () => {
    const connection = connect()
    latest().onclose?.()

    connection.reconnectNow()
    expect(sockets).toHaveLength(2)

    // The planned reconnect was cancelled
    vi.advanceTimersByTime(10000)
    expect(sockets).toHaveLength(2)
  })

  it('stays closed after close', () => {
    const connection = connect()
    latest().onopen?.()

    connection.close()
    vi.advanceTimersByTime(60000)
    connection.reconnectNow()

    expect(sockets).toHaveLength(1)
    expect(sockets[0].closed).toBe(true)
    expect(statuses).toEqual(['connecting', 'open'])
  })

  it('reconnects at once when the page becomes visible without an open connection', () => {
    const visibility = createFakeVisibility()
    connect(35000, visibility)
    latest().onopen?.()
    visibility.change(false)
    latest().onclose?.()
    vi.advanceTimersByTime(1000)
    latest().onclose?.()
    expect(sockets).toHaveLength(2)

    visibility.change(true)

    expect(sockets).toHaveLength(3)
    // The planned reconnect (2 s backoff) was cancelled
    vi.advanceTimersByTime(10000)
    expect(sockets).toHaveLength(3)
  })

  it('keeps an open connection when the page becomes visible', () => {
    const visibility = createFakeVisibility()
    connect(35000, visibility)
    latest().onopen?.()

    visibility.change(false)
    visibility.change(true)

    expect(sockets).toHaveLength(1)
    expect(sockets[0].closed).toBe(false)
  })

  it('does not reconnect when the page becomes hidden', () => {
    const visibility = createFakeVisibility()
    connect(35000, visibility)
    latest().onclose?.()

    visibility.change(false)

    expect(sockets).toHaveLength(1)
  })

  it('stops listening to the visibility after close', () => {
    const visibility = createFakeVisibility()
    const connection = connect(35000, visibility)
    latest().onclose?.()

    connection.close()
    visibility.change(true)

    expect(visibility.listeners.size).toBe(0)
    expect(sockets).toHaveLength(1)
  })
})
