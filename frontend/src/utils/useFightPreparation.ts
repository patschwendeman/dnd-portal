import { useState } from 'react'

import { initialPreparation, PreparedCombatant } from './fight'
import { Player } from '../models/models'

interface Preparation {
  adventureId: number | null
  combatants: PreparedCombatant[]
}

// The preparation of a fight is local to this Admin window until "Kampf starten". It starts with
// all players of the adventure; another adventure, and the start or end of a fight (also from
// another window), start it anew.
const useFightPreparation = (
  adventureId: number | null,
  players: Player[],
  isFighting: boolean,
): [PreparedCombatant[], (combatants: PreparedCombatant[]) => void] => {
  const [preparation, setPreparation] = useState<Preparation | null>(null)
  const [prevIsFighting, setPrevIsFighting] = useState(isFighting)
  let current = preparation
  if (isFighting !== prevIsFighting) {
    setPrevIsFighting(isFighting)
    setPreparation(null)
    current = null
  }
  const combatants = current !== null && current.adventureId === adventureId
    ? current.combatants
    : initialPreparation(players)
  const update = (next: PreparedCombatant[]) => setPreparation({ adventureId, combatants: next })
  return [combatants, update]
}

export default useFightPreparation
