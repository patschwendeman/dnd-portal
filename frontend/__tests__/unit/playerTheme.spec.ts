import {
  describe, it, expect, beforeEach,
} from 'vitest'

import {
  discardLegacyPlayerTheme,
  effectiveTheme,
  LEGACY_PLAYER_THEME_KEY,
  PLAYER_THEME_OVERRIDE_KEY,
  readThemeOverride,
  writeThemeOverride,
} from '../../src/utils/playerTheme'

class MemoryStorage {
  items = new Map<string, string>()

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.items.set(key, value)
  }

  removeItem(key: string) {
    this.items.delete(key)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
})

describe('readThemeOverride', () => {
  it('reads a stored theme', () => {
    storage.setItem(PLAYER_THEME_OVERRIDE_KEY, 'tavern')
    expect(readThemeOverride(storage)).toBe('tavern')

    storage.setItem(PLAYER_THEME_OVERRIDE_KEY, 'dark')
    expect(readThemeOverride(storage)).toBe('dark')
  })

  it('follows the game table without or with an invalid value', () => {
    expect(readThemeOverride(storage)).toBeNull()

    const invalidValues = ['', 'Dark', 'true', 'light', '"tavern"']
    invalidValues.forEach((value) => {
      storage.setItem(PLAYER_THEME_OVERRIDE_KEY, value)
      expect(readThemeOverride(storage)).toBeNull()
    })
  })
})

describe('writeThemeOverride', () => {
  it('stores the theme and removes the key for "Wie Spieltisch"', () => {
    writeThemeOverride(storage, 'tavern')
    expect(storage.getItem(PLAYER_THEME_OVERRIDE_KEY)).toBe('tavern')
    expect(readThemeOverride(storage)).toBe('tavern')

    writeThemeOverride(storage, null)
    expect(storage.items.has(PLAYER_THEME_OVERRIDE_KEY)).toBe(false)
    expect(readThemeOverride(storage)).toBeNull()
  })
})

describe('discardLegacyPlayerTheme', () => {
  it('removes the old key without taking it over', () => {
    storage.setItem(LEGACY_PLAYER_THEME_KEY, 'false')

    discardLegacyPlayerTheme(storage)

    expect(storage.items.has(LEGACY_PLAYER_THEME_KEY)).toBe(false)
    expect(readThemeOverride(storage)).toBeNull()
  })
})

describe('effectiveTheme', () => {
  it('uses the override, otherwise the theme of the game table', () => {
    expect(effectiveTheme(null, 'dark')).toBe('dark')
    expect(effectiveTheme(null, 'tavern')).toBe('tavern')
    expect(effectiveTheme('tavern', 'dark')).toBe('tavern')
    expect(effectiveTheme('dark', 'tavern')).toBe('dark')
  })
})
