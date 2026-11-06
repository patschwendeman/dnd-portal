import { describe, it, expect } from 'vitest'

import { Combatant, FightState, Player } from '../../src/models/models'
import {
  combatantAvatarText,
  combatantDetails,
  combatantName,
  countByKind,
  firstName,
  initialPreparation,
  missingPlayers,
  moveItem,
  nextOnTurn,
  numberError,
  ownTurnCombatantId,
  preparedNpc,
  preparedPlayer,
  smallestFreeNumber,
  toCombatantCreate,
} from '../../src/utils/fight'

const player = (id: number, characterName: string): Player => ({
  id,
  player_name: `Spieler ${id}`,
  character_name: characterName,
  race: 'Elfe',
  character_class: 'Magierin',
  avatar: null,
})

const PLAYERS = [player(1, 'Thalia Sturmwind'), player(2, 'Brom Eisenfaust'), player(3, 'Kael')]

const combatant = (id: number, fields: Partial<Combatant>): Combatant => ({
  id, kind: 'enemy', player_id: null, number: id, label: null, defeated: false, ...fields,
})

describe('initialPreparation', () => {
  it('starts with all players in the order of the API and no NPCs', () => {
    expect(initialPreparation(PLAYERS)).toEqual([
      {
        key: 'player-1', kind: 'player', player_id: 1, number: null, label: null,
      },
      {
        key: 'player-2', kind: 'player', player_id: 2, number: null, label: null,
      },
      {
        key: 'player-3', kind: 'player', player_id: 3, number: null, label: null,
      },
    ])
  })

  it('is empty without players', () => {
    expect(initialPreparation([])).toEqual([])
  })
})

describe('preparedNpc and toCombatantCreate', () => {
  it('trims the label and drops an empty one', () => {
    expect(preparedNpc('enemy', 3, '  Ghul ').label).toBe('Ghul')
    expect(preparedNpc('ally', 4, '   ').label).toBeNull()
  })

  it('sends a player only with its ID and an NPC with number and label', () => {
    expect(toCombatantCreate(preparedPlayer(PLAYERS[0]))).toEqual({ kind: 'player', player_id: 1 })
    expect(toCombatantCreate(preparedNpc('ally', 4, 'Borin')))
      .toEqual({ kind: 'ally', number: 4, label: 'Borin' })
  })
})

describe('smallestFreeNumber', () => {
  it('suggests 1 without NPCs', () => {
    expect(smallestFreeNumber(initialPreparation(PLAYERS))).toBe(1)
  })

  it('fills the first gap of the series shared by enemies and allies', () => {
    const list = [
      preparedNpc('enemy', 1, ''), preparedNpc('ally', 2, ''), preparedNpc('enemy', 4, ''),
    ]
    expect(smallestFreeNumber(list)).toBe(3)
  })

  it('keeps the number of a defeated combatant taken', () => {
    expect(smallestFreeNumber([combatant(1, { number: 1, defeated: true })])).toBe(2)
  })

  it('returns null when all numbers are taken', () => {
    const all = Array.from({ length: 99 }, (_, index) => preparedNpc('enemy', index + 1, ''))
    expect(smallestFreeNumber(all)).toBeNull()
  })
})

describe('numberError', () => {
  const list = [preparedNpc('enemy', 1, ''), preparedNpc('ally', 2, '')]

  it('accepts a free number from 1 to 99', () => {
    expect(numberError('3', list)).toBeNull()
    expect(numberError(' 99 ', list)).toBeNull()
  })

  it('rejects a number that is already taken, also by the other kind', () => {
    expect(numberError('1', list)).toBe('Nummer 1 ist schon vergeben.')
    expect(numberError('2', list)).toBe('Nummer 2 ist schon vergeben.')
  })

  it.each(['', ' ', '0', '100', '2.5', '-1', 'abc'])('rejects "%s" as out of range', (input) => {
    expect(numberError(input, list)).toBe('Nummer 1–99 eingeben.')
  })
})

describe('moveItem', () => {
  it('moves an item one place forward or back', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })

  it('leaves the list unchanged at the ends and does not change the original', () => {
    const list = ['a', 'b']
    expect(moveItem(list, 0, -1)).toEqual(['a', 'b'])
    expect(moveItem(list, 1, 1)).toEqual(['a', 'b'])
    moveItem(list, 0, 1)
    expect(list).toEqual(['a', 'b'])
  })
})

describe('missingPlayers and firstName', () => {
  it('lists the players that are not in the list', () => {
    const list = [preparedPlayer(PLAYERS[1]), preparedNpc('enemy', 1, '')]
    expect(missingPlayers(PLAYERS, list).map((p) => p.id)).toEqual([1, 3])
  })

  it('uses the first word of the character name', () => {
    expect(PLAYERS.map(firstName)).toEqual(['Thalia', 'Brom', 'Kael'])
  })
})

describe('combatantName, combatantDetails and combatantAvatarText', () => {
  it('shows a player with character name, race, class and player name', () => {
    const fields = combatant(1, { kind: 'player', player_id: 2, number: null })
    expect(combatantName(fields, PLAYERS)).toBe('Brom Eisenfaust')
    expect(combatantDetails(fields, PLAYERS)).toBe('Elfe, Magierin · Spieler 2')
    expect(combatantAvatarText(fields, PLAYERS)).toBe('BE')
  })

  it('shows an NPC with kind and number, the label below', () => {
    const enemy = combatant(1, { number: 3, label: 'Ghul' })
    expect(combatantName(enemy, PLAYERS)).toBe('Gegner 3')
    expect(combatantDetails(enemy, PLAYERS)).toBe('Ghul')
    expect(combatantAvatarText(enemy, PLAYERS)).toBe('3')
    expect(combatantName(combatant(2, { kind: 'ally', number: 4 }), PLAYERS)).toBe('Verbündeter 4')
    expect(combatantDetails(combatant(2, { kind: 'ally', number: 4 }), PLAYERS)).toBe('')
  })

  it('puts "Tot" before a defeated player and "Besiegt" before a defeated NPC', () => {
    const deadPlayer = combatant(1, {
      kind: 'player', player_id: 1, number: null, defeated: true,
    })
    expect(combatantDetails(deadPlayer, PLAYERS)).toBe('Tot · Elfe, Magierin · Spieler 1')
    expect(combatantDetails(combatant(2, { label: 'Ghul', defeated: true }), PLAYERS))
      .toBe('Besiegt · Ghul')
    expect(combatantDetails(combatant(3, { defeated: true }), PLAYERS)).toBe('Besiegt')
  })
})

describe('nextOnTurn', () => {
  const list = [combatant(1, {}), combatant(2, { defeated: true }), combatant(3, {})]

  it('skips defeated combatants', () => {
    expect(nextOnTurn(list, 1)).toEqual({ combatant: list[2], newRound: false })
  })

  it('starts a new round past the end of the list', () => {
    expect(nextOnTurn(list, 3)).toEqual({ combatant: list[0], newRound: true })
  })

  it('returns the combatant itself in the next round if it is the only one left', () => {
    const alone = [combatant(1, { defeated: true }), combatant(2, {})]
    expect(nextOnTurn(alone, 2)).toEqual({ combatant: alone[1], newRound: true })
  })

  it('returns null without a turn or when all are defeated', () => {
    expect(nextOnTurn(list, null)).toBeNull()
    expect(nextOnTurn([combatant(1, { defeated: true })], 1)).toBeNull()
  })
})

describe('countByKind', () => {
  it('counts players, enemies and allies', () => {
    const list = [
      combatant(1, { kind: 'player', player_id: 1, number: null }),
      combatant(2, {}),
      combatant(3, {}),
      combatant(4, { kind: 'ally' }),
    ]
    expect(countByKind(list)).toEqual({ player: 1, enemy: 2, ally: 1 })
  })
})

describe('ownTurnCombatantId', () => {
  const combatants = [
    combatant(10, { kind: 'player', player_id: 1, number: null }),
    combatant(11, { kind: 'enemy', number: 1 }),
    combatant(12, { kind: 'player', player_id: 2, number: null }),
  ]
  const fight = (activeId: number | null): FightState => ({
    round: 1, active_combatant_id: activeId, scene_id: 1, combatants,
  })

  it('returns the combatant of the player while he is on turn', () => {
    expect(ownTurnCombatantId(fight(12), 2)).toBe(12)
    expect(ownTurnCombatantId(fight(10), 1)).toBe(10)
  })

  it('returns null without a fight or without a player', () => {
    expect(ownTurnCombatantId(null, 1)).toBeNull()
    expect(ownTurnCombatantId(fight(10), null)).toBeNull()
  })

  it('returns null if the player does not take part', () => {
    expect(ownTurnCombatantId(fight(10), 3)).toBeNull()
  })

  it('returns null while another combatant is on turn', () => {
    expect(ownTurnCombatantId(fight(12), 1)).toBeNull()
    expect(ownTurnCombatantId(fight(11), 1)).toBeNull()
  })

  it('returns null while nobody is on turn', () => {
    expect(ownTurnCombatantId(fight(null), 1)).toBeNull()
  })

  it('ignores an NPC on turn even with the player ID', () => {
    const npcFight: FightState = {
      round: 1,
      active_combatant_id: 20,
      scene_id: 1,
      combatants: [combatant(20, { kind: 'ally', number: 1, player_id: 1 })],
    }
    expect(ownTurnCombatantId(npcFight, 1)).toBeNull()
  })
})
