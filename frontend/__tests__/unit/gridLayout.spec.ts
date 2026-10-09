import { describe, it, expect } from 'vitest'

import { getGridLayout } from '../../src/utils/utils'

describe('getGridLayout', () => {
  it.each([
    [0, 0, 0],
    [1, 1, 1],
    [15, 4, 4],
    [16, 4, 4],
    [24, 5, 5],
    [25, 5, 5],
    [26, 6, 5],
  ])('should lay out %i maps in %i columns and %i rows', (count, columns, rows) => {
    expect(getGridLayout(count)).toEqual({ columns, rows })
  })

  it('should place every map with integer columns and rows', () => {
    for (let count = 1; count <= 50; count++) {
      const { columns, rows } = getGridLayout(count)
      expect(Number.isInteger(columns)).toBe(true)
      expect(Number.isInteger(rows)).toBe(true)
      expect(columns * rows).toBeGreaterThanOrEqual(count)
      expect(columns * (rows - 1)).toBeLessThan(count)
    }
  })
})
