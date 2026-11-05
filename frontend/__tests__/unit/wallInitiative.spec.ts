import { describe, it, expect } from 'vitest'

import { Combatant, FightState, Player } from '../../src/models/models'
import {
  fitToWidth,
  initiativeQueue,
  InitiativeItem,
  InitiativeWidths,
  planTransitions,
  playerDetails,
  wallDetails,
  wallName,
} from '../../src/utils/wallInitiative'

const player = (id: number, characterName: string): Player => ({
  id,
  player_name: `Spieler ${id}`,
  character_name: characterName,
  race: 'Elfe',
  character_class: 'Magierin',
  avatar: null,
})

const combatant = (id: number, fields: Partial<Combatant> = {}): Combatant => ({
  id, kind: 'enemy', player_id: null, number: id, label: null, defeated: false, ...fields,
})

const fight = (
  combatants: Combatant[],
  activeId: number | null,
  round = 1,
): FightState => ({
  round, active_combatant_id: activeId, scene_id: 1, combatants,
})

// Compact form of the queue: combatant IDs, the active one with *, the divider as R<round>
const compact = (items: InitiativeItem[]): string[] => items.map((item) => {
  if (item.type === 'round') {
    return `R${item.round}`
  }
  if (item.type === 'more') {
    return `+${item.count}`
  }
  return `${item.combatant.id}${item.isActive ? '*' : ''}`
})

const FOUR = [combatant(1), combatant(2), combatant(3), combatant(4)]

describe('initiativeQueue', () => {
  it('puts the divider at the end when the first of the order is on turn', () => {
    expect(compact(initiativeQueue(fight(FOUR, 1, 3)))).toEqual(['1*', '2', '3', '4', 'R4'])
  })

  it('starts with the combatant on turn and puts the divider where the order starts again', () => {
    expect(compact(initiativeQueue(fight(FOUR, 3, 2)))).toEqual(['3*', '4', 'R3', '1', '2'])
  })

  it('puts the divider right after the last of the order when it is on turn', () => {
    expect(compact(initiativeQueue(fight(FOUR, 4)))).toEqual(['4*', 'R2', '1', '2', '3'])
  })

  it('leaves out defeated NPCs but keeps dead players', () => {
    const combatants = [
      combatant(1, {
        kind: 'player', player_id: 1, number: null, defeated: true,
      }),
      combatant(2, { defeated: true }),
      combatant(3, { kind: 'ally', defeated: true }),
      combatant(4),
    ]
    expect(compact(initiativeQueue(fight(combatants, 4)))).toEqual(['4*', 'R2', '1'])
  })

  it('keeps a defeated NPC while it is on turn', () => {
    const combatants = [combatant(1), combatant(2, { defeated: true }), combatant(3)]
    expect(compact(initiativeQueue(fight(combatants, 2)))).toEqual(['2*', '3', 'R2', '1'])
  })

  it('shows the combatants in initiative order without divider if nobody is on turn', () => {
    const combatants = [
      combatant(1, {
        kind: 'player', player_id: 1, number: null, defeated: true,
      }),
      combatant(2, { defeated: true }),
      combatant(3, {
        kind: 'player', player_id: 2, number: null, defeated: true,
      }),
    ]
    expect(compact(initiativeQueue(fight(combatants, null)))).toEqual(['1', '3'])
  })
})

const WIDTHS: InitiativeWidths = {
  active: 240, combatant: 168, round: 72, more: 96, gap: 16,
}

describe('fitToWidth', () => {
  const FIVE = [...FOUR, combatant(5)]
  const queue = initiativeQueue(fight(FIVE, 1))
  // 240 + 4 × (16 + 168) + 16 + 72
  const allWidth = 1064

  it('keeps everything that fits', () => {
    expect(compact(fitToWidth(queue, allWidth, WIDTHS)))
      .toEqual(['1*', '2', '3', '4', '5', 'R2'])
  })

  it('drops a divider at the end that does not fit, without "+N weitere"', () => {
    expect(compact(fitToWidth(queue, allWidth - 1, WIDTHS))).toEqual(['1*', '2', '3', '4', '5'])
  })

  it('replaces the combatants that do not fit by "+N weitere" with room kept for it', () => {
    // Up to the fourth: 240 + 3 × (16 + 168) = 792; "+1 weitere" needs 16 + 96 more
    expect(compact(fitToWidth(queue, 792 + 16 + 96, WIDTHS))).toEqual(['1*', '2', '3', '4', '+1'])
    expect(compact(fitToWidth(queue, 792 + 16 + 95, WIDTHS))).toEqual(['1*', '2', '3', '+2'])
  })

  it('counts only combatants as hidden, not the divider', () => {
    const middle = initiativeQueue(fight(FOUR, 3))
    expect(compact(fitToWidth(middle, 240 + 16 + 96, WIDTHS))).toEqual(['3*', '+3'])
  })
})

describe('planTransitions', () => {
  it('sorts the keys into moved, wrapped to the end, entered and left', () => {
    expect(planTransitions(['a', 'b', 'c', 'round', 'x'], ['b', 'c', 'round', 'a', 'd'])).toEqual({
      moved: ['b', 'c', 'round'],
      wrapped: ['a'],
      entered: ['d'],
      left: ['x'],
    })
  })
})

describe('wallName and wallDetails', () => {
  const thalia = player(1, 'Thalia Sturmwind')
  const thaliaCombatant = combatant(1, { kind: 'player', player_id: 1, number: null })

  it('shows the full name on turn and the first name otherwise', () => {
    expect(wallName(thaliaCombatant, thalia, true)).toBe('Thalia Sturmwind')
    expect(wallName(thaliaCombatant, thalia, false)).toBe('Thalia')
  })

  it('names NPCs by kind and number, never by label', () => {
    expect(wallName(combatant(3, { label: 'Ork' }), undefined, true)).toBe('Gegner 3')
    expect(wallName(combatant(4, { kind: 'ally', label: 'Wache' }), undefined, false))
      .toBe('Verbündeter 4')
  })

  it('shows race and class of a living player, "Tot" of a dead one and nothing for NPCs', () => {
    expect(playerDetails(thalia)).toBe('Elfe · Magierin')
    expect(wallDetails(thaliaCombatant, thalia)).toBe('Elfe · Magierin')
    expect(wallDetails({ ...thaliaCombatant, defeated: true }, thalia)).toBe('Tot')
    expect(wallDetails(combatant(3, { label: 'Ork' }), undefined)).toBe('')
  })
})
