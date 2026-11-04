import {
  deleteCommand, postCommand, replaceData, saveData,
} from '../api/saveData'
import { CombatantCreate, FightState } from '../models/models'

// Writes of the Admin to the fight of the active adventure; the Admins change only with the push of
// the server that follows. Request bodies follow the API contract (snake_case).

const startFight = async (combatants: CombatantCreate[]): Promise<FightState> => (
  postCommand('fight start', 'table/fight', { combatants })
)

const endFight = async (): Promise<void> => {
  await deleteCommand('fight end', 'table/fight')
}

// The server ignores the request if it is no longer the turn of this combatant (double click)
const endTurn = async (fromCombatantId: number): Promise<FightState> => (
  postCommand('end of turn', 'table/fight/turn', { from_combatant_id: fromCombatantId })
)

const addCombatant = async (combatant: CombatantCreate): Promise<FightState> => (
  postCommand('new combatant', 'table/fight/combatants', combatant)
)

const saveDefeated = async (combatantId: number, defeated: boolean): Promise<FightState> => (
  saveData(`combatant ${combatantId}`, `table/fight/combatants/${combatantId}`, { defeated })
)

const removeCombatant = async (combatantId: number): Promise<FightState> => (
  deleteCommand(`combatant ${combatantId}`, `table/fight/combatants/${combatantId}`)
)

// The whole order instead of a single step, so two Admin windows cannot mix up their steps
const saveFightOrder = async (combatantIds: number[]): Promise<FightState> => (
  replaceData('fight order', 'table/fight/order', { combatant_ids: combatantIds })
)

export {
  addCombatant, endFight, endTurn, removeCombatant, saveDefeated, saveFightOrder, startFight,
}
