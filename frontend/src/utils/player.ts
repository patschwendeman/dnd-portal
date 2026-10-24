// The level of all players of an adventure, as the backend accepts it
const MIN_LEVEL = 1
const MAX_LEVEL = 20

// Placeholder for a missing avatar: first letters of the first and the last word of the character
// name ("Thorin Eichenschild" → "TE", "Gimli" → "G")
export const characterInitials = (characterName: string): string => {
  const words = characterName.trim().split(/\s+/).filter((word) => word !== '')
  if (words.length === 0) {
    return ''
  }
  const first = words[0]
  const last = words[words.length - 1]
  const initials = words.length === 1 ? first.charAt(0) : first.charAt(0) + last.charAt(0)
  return initials.toLocaleUpperCase('de')
}

// The level after one step down (-1) or up (+1); null beyond the limits, so the button is disabled
export const steppedLevel = (level: number, step: -1 | 1): number | null => {
  const next = level + step
  return next >= MIN_LEVEL && next <= MAX_LEVEL ? next : null
}
