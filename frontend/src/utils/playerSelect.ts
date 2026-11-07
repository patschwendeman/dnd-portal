import { Player } from '../models/models'

export type PlayerSelectStatus = 'loading' | 'noAdventure' | 'noCharacters' | 'offline' | 'list'

interface PlayerSelectInput {
  hasState: boolean
  connected: boolean
  activeAdventureId: number | null
  /** Players of the active adventure; null while they load or after their load failed */
  players: Player[] | null
  loadFailed: boolean
}

/**
 * What the card "Party" of the character selection shows. Once the snapshot or the list is there,
 * a broken connection does not hide it: the server pushes the next state after the reconnect.
 */
export const playerSelectStatus = ({
  hasState, connected, activeAdventureId, players, loadFailed,
}: PlayerSelectInput): PlayerSelectStatus => {
  if (!hasState) {
    return connected ? 'loading' : 'offline'
  }
  if (activeAdventureId === null) {
    return 'noAdventure'
  }
  if (players !== null) {
    return players.length === 0 ? 'noCharacters' : 'list'
  }
  return loadFailed ? 'offline' : 'loading'
}

/** Only a positive whole number is an ID of a player; anything else in the URL is no player */
export const parsePlayerId = (param: string | undefined): number | null => (
  param !== undefined && /^[1-9]\d*$/.test(param) ? Number(param) : null
)

export const isPlayerOf = (playerId: number | null, players: Player[] | null): boolean => (
  playerId !== null && players !== null && players.some((player) => player.id === playerId)
)

export type PlayerRedirect = 'stay' | 'select' | 'selectWithNotice'

interface PlayerRedirectInput {
  playerId: number | null
  hasState: boolean
  activeAdventureId: number | null
  /** Players of the active adventure; null while they load or after their load failed */
  players: Player[] | null
  /** Whether the character belonged to the active adventure since the Player Screen opened */
  wasPlayer: boolean
}

/**
 * Whether the Player Screen of a character returns to the selection. Until the players are loaded
 * and after a failed load it stays, so a slow or broken connection throws nobody out of the
 * screen; the hint only follows a change of the adventure, not an old link.
 */
export const playerRedirect = ({
  playerId, hasState, activeAdventureId, players, wasPlayer,
}: PlayerRedirectInput): PlayerRedirect => {
  if (playerId === null) {
    return 'select'
  }
  if (!hasState || (activeAdventureId !== null && players === null)) {
    return 'stay'
  }
  if (activeAdventureId !== null && isPlayerOf(playerId, players)) {
    return 'stay'
  }
  return wasPlayer ? 'selectWithNotice' : 'select'
}
