import { describe, it, expect } from 'vitest'

import { characterInitials, steppedLevel } from '../../src/utils/player'

describe('characterInitials', () => {
  it('takes the first letters of the first and the last word', () => {
    expect(characterInitials('Thorin Eichenschild')).toBe('TE')
    expect(characterInitials('Elaria von Mondschein')).toBe('EM')
  })

  it('takes one letter of a single name', () => {
    expect(characterInitials('Gimli')).toBe('G')
  })

  it('writes the initials in capitals and ignores extra spaces', () => {
    expect(characterInitials('  brom   steinfaust ')).toBe('BS')
    expect(characterInitials('ömer')).toBe('Ö')
  })

  it('returns nothing for an empty name', () => {
    expect(characterInitials('')).toBe('')
    expect(characterInitials('   ')).toBe('')
  })
})

describe('steppedLevel', () => {
  it('steps up and down within the limits', () => {
    expect(steppedLevel(1, 1)).toBe(2)
    expect(steppedLevel(5, -1)).toBe(4)
    expect(steppedLevel(19, 1)).toBe(20)
    expect(steppedLevel(2, -1)).toBe(1)
  })

  it('does not go below level 1', () => {
    expect(steppedLevel(1, -1)).toBeNull()
  })

  it('does not go above level 20', () => {
    expect(steppedLevel(20, 1)).toBeNull()
  })
})
