import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest'

import {
  canTransition,
  HERO_WAIT_MS,
  runningPageTransition,
  startPageTransition,
  TransitionEnvironment,
  waitUntil,
} from '../../src/utils/viewTransition'

// Runs the update callback at once, like the browser does after capturing the old page
const fakeApi = () => {
  let updateDone: Promise<void> = Promise.resolve()
  const start = vi.fn((update: () => Promise<void>) => {
    updateDone = update()
    return { finished: updateDone.then(() => undefined) }
  })
  return { start, updateDone: () => updateDone }
}

const track = (promise: Promise<unknown>): { settled: boolean } => {
  const state = { settled: false }
  promise.then(() => {
    state.settled = true
  })
  return state
}

describe('canTransition', () => {
  it('needs the API and no "reduce motion"', () => {
    const { start } = fakeApi()
    expect(canTransition({ startViewTransition: start, reducedMotion: false })).toBe(true)
    expect(canTransition({ startViewTransition: start, reducedMotion: true })).toBe(false)
    expect(canTransition({ startViewTransition: undefined, reducedMotion: false })).toBe(false)
  })
})

describe('waitUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves true once the signal is there', async () => {
    let ready = false
    const result = waitUntil(() => ready, HERO_WAIT_MS)
    await vi.advanceTimersByTimeAsync(100)
    ready = true
    await vi.advanceTimersByTimeAsync(20)
    await expect(result).resolves.toBe(true)
  })

  it('gives up after the limit', async () => {
    const isReady = vi.fn(() => false)
    const result = waitUntil(isReady, HERO_WAIT_MS)
    await vi.advanceTimersByTimeAsync(HERO_WAIT_MS - 20)
    const state = track(result)
    await Promise.resolve()
    expect(state.settled).toBe(false)
    await vi.advanceTimersByTimeAsync(40)
    await expect(result).resolves.toBe(false)
  })
})

describe('startPageTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each<[string, TransitionEnvironment]>([
    ['without the API', { startViewTransition: undefined, reducedMotion: false }],
    ['with "reduce motion"', { startViewTransition: vi.fn(), reducedMotion: true }],
  ])('runs the update at once %s', async (_, env) => {
    const update = vi.fn()
    const finished = startPageTransition(update, () => false, env)
    expect(update).toHaveBeenCalledOnce()
    expect(env.startViewTransition ?? vi.fn()).not.toHaveBeenCalled()
    await expect(finished).resolves.toBeUndefined()
  })

  it('runs the update inside the transition and waits for the signal', async () => {
    const { start, updateDone } = fakeApi()
    const update = vi.fn()
    let ready = false
    const finished = startPageTransition(
      update,
      () => ready,
      { startViewTransition: start, reducedMotion: false },
    )
    expect(start).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
    const state = track(updateDone())
    await vi.advanceTimersByTimeAsync(50)
    expect(state.settled).toBe(false)
    ready = true
    await vi.advanceTimersByTimeAsync(20)
    expect(state.settled).toBe(true)
    await expect(finished).resolves.toBeUndefined()
  })

  it('captures the new page after the limit without the signal', async () => {
    const { start, updateDone } = fakeApi()
    startPageTransition(vi.fn(), () => false, { startViewTransition: start, reducedMotion: false })
    const state = track(updateDone())
    await vi.advanceTimersByTimeAsync(HERO_WAIT_MS - 20)
    expect(state.settled).toBe(false)
    await vi.advanceTimersByTimeAsync(40)
    expect(state.settled).toBe(true)
  })

  it('lets the next page wait for the end of the transition, also a failed one', async () => {
    const start = vi.fn(() => ({ finished: Promise.reject(new Error('skipped')) }))
    startPageTransition(vi.fn(), null, { startViewTransition: start, reducedMotion: false })
    await expect(runningPageTransition()).resolves.toBeUndefined()
  })
})
