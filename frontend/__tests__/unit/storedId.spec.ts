import { describe, it, expect } from 'vitest'

import { parseStoredId } from '../../src/utils/storedId'

describe('parseStoredId', () => {
  it('parses a stored positive integer', () => {
    expect(parseStoredId('5')).toBe(5)
    expect(parseStoredId(' 12 ')).toBe(12)
  })

  it('returns null for a missing or empty value instead of a fallback scene', () => {
    expect(parseStoredId(null)).toBeNull()
    expect(parseStoredId('')).toBeNull()
    expect(parseStoredId('   ')).toBeNull()
  })

  it('returns null for malformed values', () => {
    expect(parseStoredId('null')).toBeNull()
    expect(parseStoredId('abc')).toBeNull()
    expect(parseStoredId('3abc')).toBeNull()
    expect(parseStoredId('1.5')).toBeNull()
    expect(parseStoredId('-1')).toBeNull()
    expect(parseStoredId('0')).toBeNull()
    expect(parseStoredId('99999999999999999999')).toBeNull()
  })
})
