import { describe, it, expect } from 'vitest'

import selectPlayerUrl from '../../src/utils/playerUrl'

const at = (url: string) => {
  const { origin, hostname } = new URL(url)
  return { origin, hostname }
}

describe('selectPlayerUrl', () => {
  it('takes the URL from the API', () => {
    expect(selectPlayerUrl('http://192.168.0.10:8080/', at('http://localhost:8080/admin'))).toBe(
      'http://192.168.0.10:8080/',
    )
    expect(selectPlayerUrl('http://192.168.0.10:5173/', at('http://192.168.0.20:8080/admin'))).toBe(
      'http://192.168.0.10:5173/',
    )
  })

  it('falls back to the origin of the Admin', () => {
    expect(selectPlayerUrl(null, at('http://192.168.0.10:8080/admin')))
      .toBe('http://192.168.0.10:8080/')
    expect(selectPlayerUrl(null, at('http://dnd.local:5173/admin'))).toBe('http://dnd.local:5173/')
  })

  it('has no URL when the Admin is opened locally', () => {
    expect(selectPlayerUrl(null, at('http://localhost:8080/admin'))).toBeNull()
    expect(selectPlayerUrl(null, at('http://127.0.0.1:5173/admin'))).toBeNull()
    expect(selectPlayerUrl(null, at('http://[::1]:8080/admin'))).toBeNull()
  })
})
