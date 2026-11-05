import { describe, it, expect } from 'vitest'

import { Player } from '../../src/models/models'
import {
  isPlayerOf, parsePlayerId, playerRedirect, playerSelectStatus,
} from '../../src/utils/playerSelect'

const player = (id: number): Player => ({
  id,
  player_name: `Spieler ${id}`,
  character_name: `Held ${id}`,
  race: 'Elfe',
  character_class: 'Magierin',
  avatar: null,
})

const PARTY = [player(1), player(2)]

describe('playerSelectStatus', () => {
  const loaded = {
    hasState: true, connected: true, activeAdventureId: 1, players: PARTY, loadFailed: false,
  }

  it('lists the players of the active adventure', () => {
    expect(playerSelectStatus(loaded)).toBe('list')
  })

  it('keeps the list while the connection is broken', () => {
    expect(playerSelectStatus({ ...loaded, connected: false })).toBe('list')
  })

  it('loads until the first state and the players are there', () => {
    expect(playerSelectStatus({ ...loaded, hasState: false, players: null })).toBe('loading')
    expect(playerSelectStatus({ ...loaded, players: null })).toBe('loading')
  })

  it('reports a missing adventure and an adventure without players', () => {
    expect(playerSelectStatus({ ...loaded, activeAdventureId: null, players: null }))
      .toBe('noAdventure')
    expect(playerSelectStatus({ ...loaded, players: [] })).toBe('noCharacters')
  })

  it('reports no connection without a state or after a failed load', () => {
    expect(playerSelectStatus({
      ...loaded, hasState: false, connected: false, players: null,
    })).toBe('offline')
    expect(playerSelectStatus({ ...loaded, players: null, loadFailed: true })).toBe('offline')
  })

  it('keeps a known state without an adventure while the connection is broken', () => {
    expect(playerSelectStatus({
      ...loaded, connected: false, activeAdventureId: null, players: null,
    })).toBe('noAdventure')
  })
})

describe('parsePlayerId', () => {
  it('accepts positive whole numbers', () => {
    expect(parsePlayerId('1')).toBe(1)
    expect(parsePlayerId('42')).toBe(42)
  })

  it('rejects anything else', () => {
    ['0', '-1', '1.5', '01', 'abc', '1a', '', ' 1'].forEach((param) => {
      expect(parsePlayerId(param)).toBeNull()
    })
    expect(parsePlayerId(undefined)).toBeNull()
  })
})

describe('isPlayerOf', () => {
  it('finds the player among the loaded players', () => {
    expect(isPlayerOf(2, PARTY)).toBe(true)
    expect(isPlayerOf(3, PARTY)).toBe(false)
    expect(isPlayerOf(null, PARTY)).toBe(false)
    expect(isPlayerOf(1, null)).toBe(false)
  })
})

describe('playerRedirect', () => {
  const member = {
    playerId: 1, hasState: true, activeAdventureId: 1, players: PARTY, wasPlayer: true,
  }

  it('stays while the character belongs to the active adventure', () => {
    expect(playerRedirect(member)).toBe('stay')
  })

  it('returns with the hint once the character no longer belongs to it', () => {
    expect(playerRedirect({ ...member, activeAdventureId: 2, players: [player(3)] }))
      .toBe('selectWithNotice')
    expect(playerRedirect({ ...member, activeAdventureId: null, players: null }))
      .toBe('selectWithNotice')
  })

  it('returns without the hint for a character that never belonged to it', () => {
    expect(playerRedirect({ ...member, playerId: 3, wasPlayer: false })).toBe('select')
    expect(playerRedirect({
      ...member, activeAdventureId: null, players: null, wasPlayer: false,
    })).toBe('select')
  })

  it('returns at once for an invalid ID', () => {
    expect(playerRedirect({
      ...member, playerId: null, hasState: false, players: null, wasPlayer: false,
    })).toBe('select')
  })

  it('stays until the state and the players are loaded, also after a failed load', () => {
    expect(playerRedirect({
      ...member, hasState: false, activeAdventureId: null, players: null, wasPlayer: false,
    })).toBe('stay')
    expect(playerRedirect({ ...member, activeAdventureId: 2, players: null })).toBe('stay')
    expect(playerRedirect({ ...member, players: null, wasPlayer: false })).toBe('stay')
  })
})
