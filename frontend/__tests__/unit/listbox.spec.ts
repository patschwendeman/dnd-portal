import { describe, it, expect } from 'vitest'

import { getListboxNextIndex, getListboxStartIndex, isListboxNavigationKey } from '../../src/utils/listbox'

describe('getListboxStartIndex', () => {
  it('starts at the selected entry', () => {
    expect(getListboxStartIndex(2, 4)).toBe(2)
  })

  it('starts at the first entry without a valid selection', () => {
    expect(getListboxStartIndex(-1, 4)).toBe(0)
    expect(getListboxStartIndex(7, 4)).toBe(0)
  })

  it('returns -1 for an empty list', () => {
    expect(getListboxStartIndex(0, 0)).toBe(-1)
  })
})

describe('getListboxNextIndex', () => {
  it('moves down and up by one entry', () => {
    expect(getListboxNextIndex('ArrowDown', 1, 4)).toBe(2)
    expect(getListboxNextIndex('ArrowUp', 1, 4)).toBe(0)
  })

  it('stops at the first and last entry', () => {
    expect(getListboxNextIndex('ArrowDown', 3, 4)).toBe(3)
    expect(getListboxNextIndex('ArrowUp', 0, 4)).toBe(0)
  })

  it('jumps to the first and last entry with Home and End', () => {
    expect(getListboxNextIndex('Home', 2, 4)).toBe(0)
    expect(getListboxNextIndex('End', 1, 4)).toBe(3)
  })

  it('enters the list from outside with the arrows', () => {
    expect(getListboxNextIndex('ArrowDown', -1, 4)).toBe(0)
    expect(getListboxNextIndex('ArrowUp', -1, 4)).toBe(3)
  })

  it('returns -1 for an empty list', () => {
    expect(getListboxNextIndex('ArrowDown', 0, 0)).toBe(-1)
    expect(getListboxNextIndex('End', 0, 0)).toBe(-1)
  })
})

describe('isListboxNavigationKey', () => {
  it('accepts only the navigation keys', () => {
    expect(isListboxNavigationKey('ArrowDown')).toBe(true)
    expect(isListboxNavigationKey('End')).toBe(true)
    expect(isListboxNavigationKey('Enter')).toBe(false)
    expect(isListboxNavigationKey('Tab')).toBe(false)
  })
})
