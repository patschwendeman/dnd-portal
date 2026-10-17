import { describe, it, expect } from 'vitest'

import { reconnectDelay } from '../../src/realtime/backoff'

describe('reconnectDelay', () => {
  it('doubles from 1 s', () => {
    expect([0, 1, 2, 3].map(reconnectDelay)).toEqual([1000, 2000, 4000, 8000])
  })

  it('is capped at 10 s', () => {
    expect(reconnectDelay(4)).toBe(10000)
    expect(reconnectDelay(50)).toBe(10000)
  })

  it('treats a negative attempt as the first one', () => {
    expect(reconnectDelay(-1)).toBe(1000)
  })
})
