import { AdventureSummary, Player } from '../models/models'

/** Tooltip of everything that switches or ends the adventure during a fight */
export const ADVENTURE_LOCKED_TITLE = 'Während des Kampfes nicht wechselbar'

export type AdventureSelectStatus = 'loading' | 'empty' | 'offline' | 'list'

/**
 * What the adventure selection shows. A list loaded once stays when a later reload fails; the
 * error only replaces it while there is nothing to show.
 */
export const adventureSelectStatus = (
  adventures: AdventureSummary[] | undefined,
  loadFailed: boolean,
): AdventureSelectStatus => {
  if (adventures !== undefined) {
    return adventures.length === 0 ? 'empty' : 'list'
  }
  return loadFailed ? 'offline' : 'loading'
}

/** During a fight only the active adventure can be opened; every other card is locked */
export const isAdventureLocked = (
  adventureId: number,
  activeAdventureId: number | null,
  isFighting: boolean,
): boolean => isFighting && adventureId !== activeAdventureId

// Up to this number all members fit on the card (three rows of two); above it the last row gives
// way to "+N weitere"
const PARTY_PREVIEW_MAX = 6

interface PartyPreview {
  shown: Player[]
  /** Members left out, shown as "+N weitere" */
  hidden: number
}

/** The members on the card of an adventure: all up to six, otherwise the first five */
export const partyPreview = (players: Player[]): PartyPreview => {
  if (players.length <= PARTY_PREVIEW_MAX) {
    return { shown: players, hidden: 0 }
  }
  const shown = players.slice(0, PARTY_PREVIEW_MAX - 1)
  return { shown, hidden: players.length - shown.length }
}
