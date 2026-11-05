import { describe, it, expect } from 'vitest'

import splitParty from '../../src/utils/wallParty'

describe('splitParty', () => {
  it.each([
    [0, [], []],
    [1, [1], []],
    [2, [1], [2]],
    [4, [1, 2], [3, 4]],
    [5, [1, 2, 3], [4, 5]],
    [8, [1, 2, 3, 4], [5, 6, 7, 8]],
  ])('puts %i players as the first half left and one more left if odd', (count, left, right) => {
    const players = Array.from({ length: count }, (_, index) => index + 1)
    expect(splitParty(players)).toEqual({ left, right })
  })
})
