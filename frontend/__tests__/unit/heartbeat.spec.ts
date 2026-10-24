import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'

import { createHeartbeatWatchdog, HEARTBEAT_TIMEOUT_MS } from '../../src/realtime/heartbeat'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createHeartbeatWatchdog', () => {
  it('waits 35 s by default', () => {
    expect(HEARTBEAT_TIMEOUT_MS).toBe(35000)
  })

  it('reports a timeout once after the given time without reset', () => {
    const onTimeout = vi.fn()
    const watchdog = createHeartbeatWatchdog(onTimeout, 1000)

    watchdog.reset()
    vi.advanceTimersByTime(999)
    expect(onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('starts over with every reset', () => {
    const onTimeout = vi.fn()
    const watchdog = createHeartbeatWatchdog(onTimeout, 1000)

    watchdog.reset()
    vi.advanceTimersByTime(800)
    watchdog.reset()
    vi.advanceTimersByTime(800)
    expect(onTimeout).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('reports nothing after stop', () => {
    const onTimeout = vi.fn()
    const watchdog = createHeartbeatWatchdog(onTimeout, 1000)

    watchdog.reset()
    watchdog.stop()
    vi.advanceTimersByTime(5000)

    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('does not run before the first reset', () => {
    const onTimeout = vi.fn()
    createHeartbeatWatchdog(onTimeout, 1000)

    vi.advanceTimersByTime(5000)

    expect(onTimeout).not.toHaveBeenCalled()
  })
})
