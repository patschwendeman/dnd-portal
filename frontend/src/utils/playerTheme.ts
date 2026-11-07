import { Theme } from '../models/models'

/**
 * Theme chosen on this device that differs from the game table; missing = follows the game table
 */
export const PLAYER_THEME_OVERRIDE_KEY = 'playerThemeOverride'
/**
 * Device theme of the Player Screen from before it was connected to the game table; discarded,
 * not taken over
 */
export const LEGACY_PLAYER_THEME_KEY = 'isDarkTheme'

const THEMES: string[] = ['cyber', 'tavern'] satisfies Theme[]
/** Earlier name of the theme `cyber`; a stored override keeps working */
const LEGACY_CYBER_THEME = 'dark'

const isTheme = (value: string | null): value is Theme => value !== null && THEMES.includes(value)

/**
 * A missing or invalid value means "Wie Spieltisch" (null); a stored `dark` is read as `cyber`
 * and rewritten
 */
export const readThemeOverride = (
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): Theme | null => {
  const value = storage.getItem(PLAYER_THEME_OVERRIDE_KEY)
  if (value === LEGACY_CYBER_THEME) {
    storage.setItem(PLAYER_THEME_OVERRIDE_KEY, 'cyber')
    return 'cyber'
  }
  return isTheme(value) ? value : null
}

export const writeThemeOverride = (
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  override: Theme | null,
) => {
  if (override === null) {
    storage.removeItem(PLAYER_THEME_OVERRIDE_KEY)
  } else {
    storage.setItem(PLAYER_THEME_OVERRIDE_KEY, override)
  }
}

export const discardLegacyPlayerTheme = (storage: Pick<Storage, 'removeItem'>) => {
  storage.removeItem(LEGACY_PLAYER_THEME_KEY)
}

export const effectiveTheme = (override: Theme | null, tableTheme: Theme): Theme => (
  override ?? tableTheme
)
