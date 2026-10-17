import { AdventureSummary } from '../models/models'

// Keeps the stored adventure if it still exists, otherwise falls back to the first one, so with a single adventure
// the Admin works without any selection.
export const selectDefaultAdventureId = (
  adventures: AdventureSummary[],
  storedId: number | null
): number | null => {
  if (storedId !== null && adventures.some((adventure) => adventure.id === storedId)) {
    return storedId
  }
  return adventures.length > 0 ? adventures[0].id : null
}
