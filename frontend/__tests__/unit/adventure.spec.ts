import { describe, it, expect } from 'vitest'

import { AdventureSummary } from '../../src/models/models'
import { selectDefaultAdventureId } from '../../src/utils/adventure'

const adventures: AdventureSummary[] = [
  { id: 3, name: 'Erstes Abenteuer', description: null },
  { id: 8, name: 'Zweites Abenteuer', description: 'Elsewhere' },
]

describe('selectDefaultAdventureId', () => {
  it('keeps an active adventure that is in the list', () => {
    expect(selectDefaultAdventureId(adventures, 8)).toBe(8)
  })

  it('keeps an active adventure that is missing from the loaded list', () => {
    expect(selectDefaultAdventureId(adventures, 42)).toBe(42)
    expect(selectDefaultAdventureId([], 3)).toBe(3)
  })

  it('selects the first adventure without an active adventure', () => {
    expect(selectDefaultAdventureId(adventures, null)).toBe(3)
  })

  it('selects no adventure for an empty list without an active adventure', () => {
    expect(selectDefaultAdventureId([], null)).toBeNull()
  })
})
