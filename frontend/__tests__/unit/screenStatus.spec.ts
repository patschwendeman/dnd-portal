import { describe, it, expect } from 'vitest'

import { ScreenCounts } from '../../src/realtime/messages'
import {
  FullscreenHints,
  NO_FULLSCREEN_HINTS,
  NO_STATUS,
  fullscreenHintText,
  playerStatusText,
  screenStatusText,
  updateFullscreenHints,
} from '../../src/utils/screenStatus'

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

describe('updateFullscreenHints', () => {
  const counts = (
    wall: number,
    ground: number,
    fullscreen: { wall: number, ground: number },
  ): ScreenCounts => ({
    wall, ground, player: 0, fullscreen,
  })
  const both: FullscreenHints = { wall: true, ground: true }

  it('keeps the hints while the screens are connected but not in full screen', () => {
    expect(updateFullscreenHints(both, counts(1, 2, { wall: 0, ground: 0 }))).toEqual(both)
  })

  it('drops the hint once a screen of the type is in full screen', () => {
    expect(updateFullscreenHints(both, counts(2, 1, { wall: 1, ground: 0 })))
      .toEqual({ wall: false, ground: true })
  })

  it('drops the hint once no screen of the type is connected', () => {
    expect(updateFullscreenHints(both, counts(1, 0, { wall: 0, ground: 0 })))
      .toEqual({ wall: true, ground: false })
  })

  it('never sets a hint itself', () => {
    expect(updateFullscreenHints(NO_FULLSCREEN_HINTS, counts(1, 1, { wall: 0, ground: 0 })))
      .toEqual(NO_FULLSCREEN_HINTS)
  })

  it('names the window to click into', () => {
    expect(fullscreenHintText('Wall')).toBe(
      'Vollbild vom Browser abgelehnt – einmal in das Wall-Fenster klicken',
    )
  })
})
