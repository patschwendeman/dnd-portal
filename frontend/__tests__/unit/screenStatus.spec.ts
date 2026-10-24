import { describe, it, expect } from 'vitest'

import { NO_STATUS, playerStatusText, screenStatusText } from '../../src/utils/screenStatus'

describe('screenStatusText', () => {
  it('shows no status before the server sent the counts', () => {
    expect(screenStatusText(null)).toBe(NO_STATUS)
  })

  it('reports a missing screen', () => {
    expect(screenStatusText(0)).toBe('nicht verbunden')
  })

  it('reports one connected screen without a number', () => {
    expect(screenStatusText(1)).toBe('verbunden')
  })

  it('reports the number of more than one connected screen', () => {
    expect(screenStatusText(2)).toBe('2 verbunden')
    expect(screenStatusText(5)).toBe('5 verbunden')
  })
})

describe('playerStatusText', () => {
  it('shows no status before the server sent the counts', () => {
    expect(playerStatusText(null)).toBe(NO_STATUS)
  })

  it('reports the number of connected players', () => {
    expect(playerStatusText(0)).toBe('0 Spieler verbunden')
    expect(playerStatusText(2)).toBe('2 Spieler verbunden')
  })
})
