import { AdventureSummary } from '../models/models'

// Keeps the active adventure of the game table, even if it is missing from a list loaded earlier (another Admin may
// have created it since). Only without an active adventure it falls back to the first one, so with a single adventure
// the Admin works without any selection.
export const selectDefaultAdventureId = (
  adventures: AdventureSummary[],
  activeId: number | null
): number | null => {
  if (activeId !== null) {
    return activeId
  }
  return adventures.length > 0 ? adventures[0].id : null
}
