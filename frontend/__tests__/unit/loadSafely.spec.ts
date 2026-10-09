import { describe, it, expect, vi } from 'vitest'

import { loadSafely } from '../../src/utils/loadSafely'

describe('loadSafely', () => {
  it('passes a failed load to onError and resolves instead of rejecting', async () => {
    const error = new Error('Backend not reachable')
    const onError = vi.fn()
    await expect(loadSafely(() => Promise.reject(error), onError)).resolves.toBeUndefined()
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('does not call onError when the load succeeds', async () => {
    const onError = vi.fn()
    const load = vi.fn(() => Promise.resolve())
    await loadSafely(load, onError)
    expect(load).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
})
