import {
  Combatant, CombatantCreate, CombatantKind, FightState, Player,
} from '../models/models'
import { characterInitials } from './player'

// Numbers of the figures on the table, as the backend accepts them
const MIN_NUMBER = 1
const MAX_NUMBER = 99

type NpcKind = Exclude<CombatantKind, 'player'>

// A combatant of the preparation (local to the Admin window until "Kampf starten"); the same
// fields as a combatant of the fight, without an ID
interface PreparedCombatant {
  key: string
  kind: CombatantKind
  player_id: number | null
  number: number | null
  label: string | null
}

// The fields both a prepared and a running combatant have
type CombatantFields = Pick<Combatant, 'kind' | 'player_id' | 'number' | 'label'> & {
  defeated?: boolean
}

// A row of the panel "Kampf": a prepared combatant or one of the running fight
interface FightRow {
  key: string
  combatant: CombatantFields
}

const KIND_NAMES: Record<NpcKind, string> = { enemy: 'Gegner', ally: 'Verbündeter' }

const preparedPlayer = (player: Player): PreparedCombatant => ({
  key: `player-${player.id}`, kind: 'player', player_id: player.id, number: null, label: null,
})

const preparedNpc = (kind: NpcKind, number: number, label: string): PreparedCombatant => ({
  key: `npc-${number}`, kind, player_id: null, number, label: label.trim() || null,
})

// Start of every preparation: all players of the adventure in the order of the API, no NPCs
const initialPreparation = (players: Player[]): PreparedCombatant[] => players.map(preparedPlayer)

const toCombatantCreate = ({
  kind, player_id: playerId, number, label,
}: CombatantFields): CombatantCreate => (
  kind === 'player'
    ? { kind, player_id: playerId }
    : { kind, number, label }
)

const usedNumbers = (combatants: CombatantFields[]): number[] => combatants
  .map((combatant) => combatant.number)
  .filter((number): number is number => number !== null)

// Enemies and allies share one series of numbers; a number stays taken while its combatant is in
// the list, also when defeated. null if all are taken.
const smallestFreeNumber = (combatants: CombatantFields[]): number | null => {
  const used = new Set(usedNumbers(combatants))
  for (let number = MIN_NUMBER; number <= MAX_NUMBER; number += 1) {
    if (!used.has(number)) {
      return number
    }
  }
  return null
}

// Error message for the number field, null if the number can be added
const numberError = (input: string, combatants: CombatantFields[]): string | null => {
  const number = Number(input.trim())
  const isInRange = Number.isInteger(number) && number >= MIN_NUMBER && number <= MAX_NUMBER
  if (input.trim() === '' || !isInRange) {
    return `Nummer ${MIN_NUMBER}–${MAX_NUMBER} eingeben.`
  }
  if (usedNumbers(combatants).includes(number)) {
    return `Nummer ${number} ist schon vergeben.`
  }
  return null
}

// The list with the item at `index` moved one place forward (-1) or back (+1); unchanged at the
// ends
const moveItem = <T>(items: T[], index: number, step: -1 | 1): T[] => {
  const target = index + step
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
    return items
  }
  const moved = [...items]
  moved.splice(target, 0, ...moved.splice(index, 1))
  return moved
}

// Players of the adventure that are not in the list (to add them again)
const missingPlayers = (players: Player[], combatants: CombatantFields[]): Player[] => (
  players.filter((player) => !combatants.some((combatant) => combatant.player_id === player.id))
)

// Short name of a player on the button "+ Vorname": the first word of the character name
const firstName = (player: Player): string => player.character_name.trim().split(/\s+/)[0] ?? ''

// The name shown for a combatant: the character name of a player, "Gegner 3" or "Verbündeter 4"
const combatantName = (combatant: CombatantFields, players: Player[]): string => {
  if (combatant.kind === 'player') {
    return players.find((player) => player.id === combatant.player_id)?.character_name ?? ''
  }
  return `${KIND_NAMES[combatant.kind]} ${combatant.number}`
}

// The line below the name: race, class and player name, or the label of an NPC; out of the fight
// "Tot" (player) or "Besiegt" (NPC) comes first
const combatantDetails = (combatant: CombatantFields, players: Player[]): string => {
  const isPlayer = combatant.kind === 'player'
  const player = isPlayer ? players.find((p) => p.id === combatant.player_id) : undefined
  const status = combatant.defeated ? [isPlayer ? 'Tot' : 'Besiegt'] : []
  const details = player
    ? [`${player.race}, ${player.character_class} · ${player.player_name}`]
    : [combatant.label ?? '']
  return [...status, ...details].filter((part) => part !== '').join(' · ')
}

// Text of the avatar without an image: initials of a player, number of an NPC
const combatantAvatarText = (combatant: CombatantFields, players: Player[]): string => (
  combatant.kind === 'player'
    ? characterInitials(combatantName(combatant, players))
    : String(combatant.number)
)

const kindName = (kind: NpcKind): string => KIND_NAMES[kind]

// Who follows the combatant on turn: the next one not defeated; `newRound` if the search went
// past the end of the list. null without a turn or if nobody is left.
const nextOnTurn = (
  combatants: Combatant[],
  activeId: number | null,
): { combatant: Combatant, newRound: boolean } | null => {
  const index = combatants.findIndex((combatant) => combatant.id === activeId)
  if (index < 0) {
    return null
  }
  for (let step = 1; step <= combatants.length; step += 1) {
    const candidate = combatants[(index + step) % combatants.length]
    if (!candidate.defeated) {
      return { combatant: candidate, newRound: index + step >= combatants.length }
    }
  }
  return null
}

// The combatant of the player on turn on his Player Screen; null without a fight, if the player
// does not take part or another combatant is on turn
const ownTurnCombatantId = (fight: FightState | null, playerId: number | null): number | null => {
  if (fight === null || playerId === null) {
    return null
  }
  const active = fight.combatants.find((combatant) => combatant.id === fight.active_combatant_id)
  return active?.kind === 'player' && active.player_id === playerId ? active.id : null
}

// Number of combatants per kind, for the head of the panel "Initiative"
const countByKind = (combatants: CombatantFields[]): Record<CombatantKind, number> => ({
  player: combatants.filter((combatant) => combatant.kind === 'player').length,
  enemy: combatants.filter((combatant) => combatant.kind === 'enemy').length,
  ally: combatants.filter((combatant) => combatant.kind === 'ally').length,
})

export type {
  FightRow, NpcKind, PreparedCombatant,
}
export {
  combatantAvatarText,
  combatantDetails,
  combatantName,
  countByKind,
  firstName,
  initialPreparation,
  kindName,
  missingPlayers,
  moveItem,
  nextOnTurn,
  numberError,
  ownTurnCombatantId,
  preparedNpc,
  preparedPlayer,
  smallestFreeNumber,
  toCombatantCreate,
}
