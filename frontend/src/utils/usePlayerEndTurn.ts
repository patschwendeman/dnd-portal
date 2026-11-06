import { useState } from 'react'

import { FightState } from '../models/models'
import { endTurn } from '../service/fight'

interface PlayerEndTurn {
  // While the request runs: the button is disabled, so a double tap sends only one request
  isEnding: boolean
  // The last request failed; cleared by the next tap or the next push of the fight
  failed: boolean
  end: (combatantId: number) => void
}

// "Zug beenden" on the Player Screen, without anticipating the result: the turn passes on only
// with the push of the server that follows
const usePlayerEndTurn = (fight: FightState | null): PlayerEndTurn => {
  const [isEnding, setEnding] = useState(false)
  const [failed, setFailed] = useState(false)

  // Each push is a new object; reset during render instead of in an effect
  const [prevFight, setPrevFight] = useState(fight)
  if (fight !== prevFight) {
    setPrevFight(fight)
    setFailed(false)
  }

  const end = (combatantId: number) => {
    setEnding(true)
    setFailed(false)
    endTurn(combatantId)
      .catch((err: unknown) => {
        console.error('Error ending the turn:', err)
        setFailed(true)
      })
      .finally(() => setEnding(false))
  }

  return { isEnding, failed, end }
}

export default usePlayerEndTurn
