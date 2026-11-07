/**
 * The players at the left and the right edge of the Wall, in the order of the API: the first half
 * left, the rest right; with an odd number one more left (5 → 3/2)
 */
const splitParty = <T>(players: T[]): { left: T[], right: T[] } => {
  const leftCount = Math.ceil(players.length / 2)
  return { left: players.slice(0, leftCount), right: players.slice(leftCount) }
}

export default splitParty
