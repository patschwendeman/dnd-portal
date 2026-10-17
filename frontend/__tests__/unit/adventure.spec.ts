import { describe, it, expect } from 'vitest'

import { AdventureSummary } from '../../src/models/models'
import { selectDefaultAdventureId } from '../../src/utils/adventure'

const adventures: AdventureSummary[] = [
  { id: 3, name: 'Erstes Abenteuer', description: null },
  { id: 8, name: 'Zweites Abenteuer', description: 'Elsewhere' },
]

describe('selectDefaultAdventureId', () => {
  it('keeps a stored adventure that exists', () => {
    expect(selectDefaultAdventureId(adventures, 8)).toBe(8)
  })

  it('falls back to the first adventure for an unknown stored ID', () => {
    expect(selectDefaultAdventureId(adventures, 42)).toBe(3)
  })

  it('selects the first adventure without a stored ID', () => {
    expect(selectDefaultAdventureId(adventures, null)).toBe(3)
  })

  it('selects no adventure for an empty list', () => {
    expect(selectDefaultAdventureId([], null)).toBeNull()
    expect(selectDefaultAdventureId([], 3)).toBeNull()
  })
})
