import { describe, it, expect } from 'vitest'

import { AdventureSummary, Player } from '../../src/models/models'
import {
  adventureSelectStatus, isAdventureLocked, partyPreview,
} from '../../src/utils/adventureSelect'

const player = (id: number): Player => ({
  id,
  player_name: `Spieler ${id}`,
  character_name: `Held ${id}`,
  race: 'Elfe',
  character_class: 'Magierin',
  avatar: null,
})

const party = (count: number): Player[] => Array.from({ length: count }, (_, i) => player(i + 1))

const adventure: AdventureSummary = {
  id: 3,
  name: 'Erstes Abenteuer',
  description: null,
  global_level: 1,
  players: party(4),
  image: null,
}

describe('adventureSelectStatus', () => {
  it('loads until the list is there', () => {
    expect(adventureSelectStatus(undefined, false)).toBe('loading')
  })

  it('lists the loaded adventures and reports an empty list', () => {
    expect(adventureSelectStatus([adventure], false)).toBe('list')
    expect(adventureSelectStatus([], false)).toBe('empty')
  })

  it('reports no connection after a failed load without a list', () => {
    expect(adventureSelectStatus(undefined, true)).toBe('offline')
  })

  it('keeps a loaded list when a later load fails', () => {
    expect(adventureSelectStatus([adventure], true)).toBe('list')
  })
})

describe('isAdventureLocked', () => {
  it('locks every adventure but the active one during a fight', () => {
    expect(isAdventureLocked(8, 3, true)).toBe(true)
    expect(isAdventureLocked(3, 3, true)).toBe(false)
  })

  it('locks nothing without a fight', () => {
    expect(isAdventureLocked(8, 3, false)).toBe(false)
    expect(isAdventureLocked(8, null, false)).toBe(false)
  })
})

describe('partyPreview', () => {
  it('shows all members up to six', () => {
    expect(partyPreview([])).toEqual({ shown: [], hidden: 0 })
    expect(partyPreview(party(4))).toEqual({ shown: party(4), hidden: 0 })
    expect(partyPreview(party(6))).toEqual({ shown: party(6), hidden: 0 })
  })

  it('shows the first five and the rest as a number from seven members', () => {
    expect(partyPreview(party(7))).toEqual({ shown: party(5), hidden: 2 })
    expect(partyPreview(party(12))).toEqual({ shown: party(5), hidden: 7 })
  })
})
