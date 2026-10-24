export type ListboxNavigationKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'

const NAVIGATION_KEYS: string[] = ['ArrowDown', 'ArrowUp', 'Home', 'End']

export const isListboxNavigationKey = (key: string): key is ListboxNavigationKey => (
  NAVIGATION_KEYS.includes(key)
)

// Opening the list focuses the selected entry so the Game Master continues from the current
// adventure; without a selection it starts at the top. -1 means there is nothing to focus.
export const getListboxStartIndex = (selectedIndex: number, count: number): number => {
  if (count <= 0) {
    return -1
  }
  return selectedIndex >= 0 && selectedIndex < count ? selectedIndex : 0
}

// The arrows stop at the first and last entry instead of wrapping around, like a native select.
export const getListboxNextIndex = (
  key: ListboxNavigationKey,
  currentIndex: number,
  count: number,
): number => {
  if (count <= 0) {
    return -1
  }
  const lastIndex = count - 1
  switch (key) {
    case 'Home':
      return 0
    case 'End':
      return lastIndex
    case 'ArrowDown':
      return currentIndex < 0 ? 0 : Math.min(currentIndex + 1, lastIndex)
    case 'ArrowUp':
      return currentIndex < 0 ? lastIndex : Math.max(currentIndex - 1, 0)
    default: {
      // All keys are handled; tsc reports a new key here
      const unhandled: never = key
      return unhandled
    }
  }
}
