/**
 * - pending: the page transition from the selection still runs, the tiles are invisible
 * - building: the tiles come in one after the other
 * - done: everything stands
 * - exiting: the tiles fade out before the page transition back to the selection
 */
export type EntrancePhase = 'pending' | 'building' | 'done' | 'exiting'

/** The side a tile comes in from */
export type TileOrigin = 'top' | 'bottom' | 'left' | 'right'

export interface TileEntrance {
  /** Position in the build-up; each step starts a little later */
  index: number
  origin: TileOrigin
}

/** `location.state` the selection gives the Admin when it opens an adventure */
export interface AdminEntrance {
  entrance: 'select'
  /** Media path of the card image, shown as background before the Admin loaded the adventure */
  image: string | null
}

/** `location.state` the Admin gives the selection when it ends an adventure */
export interface SelectReturn {
  /** Its card receives the background as it shrinks */
  endedAdventureId: number
}

export const HEADER_START_TILE: TileEntrance = { index: 0, origin: 'top' }
export const HEADER_CENTER_TILE: TileEntrance = { index: 1, origin: 'top' }
export const HEADER_END_TILE: TileEntrance = { index: 2, origin: 'top' }
export const NAV_RAIL_TILE: TileEntrance = { index: 2, origin: 'left' }
export const NAV_PANEL_TILE: TileEntrance = { index: 3, origin: 'left' }

/** All note pages after the first one come in together */
export const notePageTile = (position: number): TileEntrance => (
  { index: position === 0 ? 4 : 5, origin: 'bottom' }
)

/** The panels of the dashboard, from the top */
export const dashboardTile = (position: number): TileEntrance => (
  { index: 5 + position, origin: 'right' }
)

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

/** The entrance from the selection, null for any other way into the Admin (reload, direct link) */
export const readAdminEntrance = (state: unknown): AdminEntrance | null => {
  if (!isRecord(state) || state.entrance !== 'select') {
    return null
  }
  return { entrance: 'select', image: typeof state.image === 'string' ? state.image : null }
}

/** The adventure the Admin just ended, null for any other way into the selection */
export const readSelectReturn = (state: unknown): number | null => (
  isRecord(state) && typeof state.endedAdventureId === 'number' ? state.endedAdventureId : null
)

/** Only an entrance from the selection builds the tiles up, and not with "reduce motion" */
export const initialEntrancePhase = (
  entrance: AdminEntrance | null,
  reducedMotion: boolean,
): EntrancePhase => (entrance === null || reducedMotion ? 'done' : 'pending')
