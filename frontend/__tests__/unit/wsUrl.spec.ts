import { describe, it, expect } from 'vitest'

import wsUrl from '../../src/api/wsUrl'

const page = (href: string) => ({ href })

describe('wsUrl', () => {
  it('uses /ws on the host of the page for the relative proxy base', () => {
    expect(wsUrl('/api/', page('http://192.168.0.10:8080/wall'))).toBe('ws://192.168.0.10:8080/ws')
    expect(wsUrl('/api/', page('http://localhost:5173/admin'))).toBe('ws://localhost:5173/ws')
  })

  it('uses wss for a page served over https', () => {
    expect(wsUrl('/api/', page('https://table.example/ground'))).toBe('wss://table.example/ws')
  })

  it('uses /ws on the host of an absolute base ending in /api/', () => {
    expect(wsUrl('http://table.example:8080/api/', page('http://localhost:5173/')))
      .toBe('ws://table.example:8080/ws')
  })

  it('appends ws to a direct API URL', () => {
    expect(wsUrl('http://localhost:8000/', page('http://localhost:5173/admin')))
      .toBe('ws://localhost:8000/ws')
    expect(wsUrl('http://localhost:8000', page('http://localhost:5173/admin')))
      .toBe('ws://localhost:8000/ws')
    expect(wsUrl('https://example.com/backend/', page('http://localhost:5173/')))
      .toBe('wss://example.com/backend/ws')
  })
})
