import { describe, it, expect } from 'vitest'

import { GROUND_GRID_CELL_SIZE, gridLineColor, toCellSize } from '../../src/utils/groundGrid'

describe('gridLineColor', () => {
  it('draws the lines in the chosen colour', () => {
    expect(gridLineColor('black')).toBe('black')
    expect(gridLineColor('white')).toBe('white')
  })

  it('draws no grid when it is off', () => {
    expect(gridLineColor('off')).toBeNull()
  })
})

describe('toCellSize', () => {
  it('keeps a value of the slider that the API accepts', () => {
    expect(toCellSize(100)).toBe(100)
    expect(toCellSize(150)).toBe(150)
    expect(toCellSize(200)).toBe(200)
  })

  it('takes the first value of a range slider', () => {
    expect(toCellSize([170, 190])).toBe(170)
  })

  it('rounds to the step of 10', () => {
    expect(toCellSize(154)).toBe(150)
    expect(toCellSize(156)).toBe(160)
  })

  it('stays within 100 to 200', () => {
    expect(toCellSize(40)).toBe(GROUND_GRID_CELL_SIZE.min)
    expect(toCellSize(260)).toBe(GROUND_GRID_CELL_SIZE.max)
  })
})
