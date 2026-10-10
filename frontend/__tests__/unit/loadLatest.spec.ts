import { describe, it, expect, vi } from 'vitest'

import { loadLatest } from '../../src/utils/loadSafely'

describe('loadLatest', () => {
  it('applies the result when the load is not stale', async () => {
    const apply = vi.fn()
    const onError = vi.fn()
    await loadLatest(() => Promise.resolve('scene 2'), apply, onError, () => false)
    expect(apply).toHaveBeenCalledWith('scene 2')
    expect(onError).not.toHaveBeenCalled()
  })

  it('drops the result when the load became stale before it resolved', async () => {
    let stale = false
    let resolve: (value: string) => void = () => {}
    const apply = vi.fn()
    const onError = vi.fn()
    const pending = loadLatest(
      () => new Promise<string>((r) => { resolve = r }),
      apply,
      onError,
      () => stale
    )
    stale = true
    resolve('scene 1')
    await pending
    expect(apply).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('passes a failed load to onError when the load is not stale', async () => {
    const error = new Error('Backend not reachable')
    const apply = vi.fn()
    const onError = vi.fn()
    await loadLatest(() => Promise.reject(error), apply, onError, () => false)
    expect(onError).toHaveBeenCalledWith(error)
    expect(apply).not.toHaveBeenCalled()
  })

  it('drops the error when the load became stale before it failed', async () => {
    let stale = false
    let reject: (error: unknown) => void = () => {}
    const apply = vi.fn()
    const onError = vi.fn()
    const pending = loadLatest(
      () => new Promise<string>((_, r) => { reject = r }),
      apply,
      onError,
      () => stale
    )
    stale = true
    reject(new Error('Backend not reachable'))
    await pending
    expect(onError).not.toHaveBeenCalled()
    expect(apply).not.toHaveBeenCalled()
  })

  it('resolves instead of rejecting, whether the failed load is stale or not', async () => {
    const error = new Error('Backend not reachable')
    await expect(loadLatest(() => Promise.reject(error), vi.fn(), vi.fn(), () => false)).resolves.toBeUndefined()
    await expect(loadLatest(() => Promise.reject(error), vi.fn(), vi.fn(), () => true)).resolves.toBeUndefined()
  })
})
