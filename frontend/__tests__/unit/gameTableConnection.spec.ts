import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ConnectionStatus, createGameTableConnection, SocketLike } from '../../src/realtime/connection'

// The payload follows the API contract, whose fields are snake_case
/* eslint-disable camelcase */
const state = { active_adventure_id: 1, active_scene_id: 5, theme: 'dark' }

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  closed = false

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

const connect = (heartbeatTimeoutMs = 35000) =>
  createGameTableConnection({
    url: 'ws://localhost/ws?screen=wall',
    onState: (payload) => states.push(payload),
    onStatus: (status) => statuses.push(status),
    createSocket: () => {
      const socket = new FakeSocket()
      sockets.push(socket)
      return socket
    },
    heartbeatTimeoutMs,
  })

const latest = () => sockets[sockets.length - 1]

beforeEach(() => {
  vi.useFakeTimers()
  sockets = []
  statuses = []
  states = []
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
})
