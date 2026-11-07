import { Combatant, FightState, Player } from '../models/models'
import { firstName, kindName } from './fight'

/**
 * One entry of the initiative strip on the Wall: a combatant, the divider before the next round or
 * the tile that stands for the combatants that do not fit
 */
type InitiativeItem = { type: 'combatant', key: string, combatant: Combatant, isActive: boolean }
  | { type: 'round', key: string, round: number }
  | { type: 'more', key: string, count: number }

/** Widths of the entries and the gap between them, in px */
interface InitiativeWidths {
  active: number
  combatant: number
  round: number
  more: number
  gap: number
}

// What happens to each entry of the strip when the turn passes on
interface InitiativeTransitions {
  /** Still there, moves forward (and grows if it is now on turn) */
  moved: string[]
  /** Moved to the end: fades out at its old place and comes in from the right */
  wrapped: string[]
  /** Not there before */
  entered: string[]
  /** Gone: fades out */
  left: string[]
}

// Defeated NPCs leave the Wall, dead players stay; whoever is on turn is always shown
const isShownOnWall = (combatant: Combatant, activeId: number | null): boolean => (
  combatant.kind === 'player' || !combatant.defeated || combatant.id === activeId
)

const combatantItem = (combatant: Combatant, activeId: number | null): InitiativeItem => ({
  type: 'combatant',
  key: `combatant-${combatant.id}`,
  combatant,
  isActive: combatant.id === activeId,
})

/**
 * The queue from the combatant on turn on, in initiative order. The divider "Runde N+1" stands
 * where the order starts again (at the end if the first of the order is on turn). Without anybody
 * on turn the combatants in initiative order, without divider.
 */
const initiativeQueue = (fight: FightState): InitiativeItem[] => {
  const activeId = fight.active_combatant_id
  const shown = fight.combatants.filter((combatant) => isShownOnWall(combatant, activeId))
  const activeIndex = shown.findIndex((combatant) => combatant.id === activeId)
  if (activeIndex < 0) {
    return shown.map((combatant) => combatantItem(combatant, activeId))
  }
  const queue = [...shown.slice(activeIndex), ...shown.slice(0, activeIndex)]
    .map((combatant) => combatantItem(combatant, activeId))
  const roundIndex = shown.length - activeIndex
  return [
    ...queue.slice(0, roundIndex),
    { type: 'round', key: 'round', round: fight.round + 1 },
    ...queue.slice(roundIndex),
  ]
}

const itemWidth = (item: InitiativeItem, widths: InitiativeWidths): number => {
  if (item.type === 'round') {
    return widths.round
  }
  if (item.type === 'more') {
    return widths.more
  }
  return item.isActive ? widths.active : widths.combatant
}

const countCombatants = (items: InitiativeItem[]): number => (
  items.filter((item) => item.type === 'combatant').length
)

/**
 * As many entries as fit into the width; if combatants are left over, a tile "+N weitere" takes
 * their place (room for it is kept as long as combatants follow)
 */
const fitToWidth = (
  items: InitiativeItem[],
  available: number,
  widths: InitiativeWidths,
): InitiativeItem[] => {
  const fitted: InitiativeItem[] = []
  let used = 0
  for (let index = 0; index < items.length; index += 1) {
    const needed = used + (fitted.length > 0 ? widths.gap : 0) + itemWidth(items[index], widths)
    const reserve = countCombatants(items.slice(index + 1)) > 0 ? widths.gap + widths.more : 0
    if (needed + reserve > available) {
      const hidden = countCombatants(items.slice(index))
      return hidden > 0 ? [...fitted, { type: 'more', key: 'more', count: hidden }] : fitted
    }
    used = needed
    fitted.push(items[index])
  }
  return fitted
}

/**
 * Compares the keys of the strip before and after the turn passes on: a key further back than
 * before went to the end (wrapped), every other key that stays moved forward or kept its place
 * (moved)
 */
const planTransitions = (before: string[], after: string[]): InitiativeTransitions => {
  const transitions: InitiativeTransitions = {
    moved: [], wrapped: [], entered: [], left: [],
  }
  after.forEach((key, index) => {
    const previous = before.indexOf(key)
    if (previous < 0) {
      transitions.entered.push(key)
    } else if (index > previous) {
      transitions.wrapped.push(key)
    } else {
      transitions.moved.push(key)
    }
  })
  transitions.left = before.filter((key) => !after.includes(key))
  return transitions
}

const playerDetails = (player: Player): string => `${player.race} · ${player.character_class}`

/**
 * On turn the full character name, otherwise the first name; NPCs as "Gegner 3" or "Verbündeter 4",
 * never with their label
 */
const wallName = (combatant: Combatant, player: Player | undefined, isActive: boolean): string => {
  if (combatant.kind !== 'player') {
    return `${kindName(combatant.kind)} ${combatant.number}`
  }
  if (!player) {
    return ''
  }
  return isActive ? player.character_name : firstName(player)
}

/** The line below the name: "Tot" or race and class of a player, nothing for an NPC */
const wallDetails = (combatant: Combatant, player: Player | undefined): string => {
  if (combatant.kind !== 'player') {
    return ''
  }
  if (combatant.defeated) {
    return 'Tot'
  }
  return player ? playerDetails(player) : ''
}

export type { InitiativeItem, InitiativeWidths }
export {
  fitToWidth,
  initiativeQueue,
  planTransitions,
  playerDetails,
  wallDetails,
  wallName,
}
