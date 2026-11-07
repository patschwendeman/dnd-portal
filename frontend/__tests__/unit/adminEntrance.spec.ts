import { describe, expect, it } from 'vitest'

import {
  dashboardTile,
  initialEntrancePhase,
  notePageTile,
  readAdminEntrance,
  readSelectReturn,
} from '../../src/utils/adminEntrance'

const FOREST = '/media/images/wall_screen/forest.jpg'

describe('readAdminEntrance', () => {
  it('reads the entrance from the selection with the card image', () => {
    expect(readAdminEntrance({ entrance: 'select', image: FOREST }))
      .toEqual({ entrance: 'select', image: FOREST })
  })

  it('reads an entrance without an image', () => {
    expect(readAdminEntrance({ entrance: 'select', image: null }))
      .toEqual({ entrance: 'select', image: null })
  })

  it.each([null, undefined, 'select', {}, { entrance: 'reload' }, { endedAdventureId: 1 }])(
    'finds no entrance in %j',
    (state) => {
      expect(readAdminEntrance(state)).toBeNull()
    },
  )
})

describe('readSelectReturn', () => {
  it('reads the ended adventure', () => {
    expect(readSelectReturn({ endedAdventureId: 2 })).toBe(2)
  })

  it.each([null, undefined, {}, { endedAdventureId: '2' }, { entrance: 'select', image: null }])(
    'finds no return in %j',
    (state) => {
      expect(readSelectReturn(state)).toBeNull()
    },
  )
})

describe('initialEntrancePhase', () => {
  const entrance = { entrance: 'select' as const, image: FOREST }

  it('waits for the page transition after an entrance from the selection', () => {
    expect(initialEntrancePhase(entrance, false)).toBe('pending')
  })

  it('stands at once without an entrance or with "reduce motion"', () => {
    expect(initialEntrancePhase(null, false)).toBe('done')
    expect(initialEntrancePhase(entrance, true)).toBe('done')
  })
})

describe('tiles of the build-up', () => {
  it('lets the first note page come in before all others, from below', () => {
    expect([0, 1, 2].map(notePageTile)).toEqual([
      { index: 4, origin: 'bottom' },
      { index: 5, origin: 'bottom' },
      { index: 5, origin: 'bottom' },
    ])
  })

  it('lets the dashboard panels come in from the right, the first with the later pages', () => {
    expect([0, 1, 2, 3].map(dashboardTile)).toEqual([
      { index: 5, origin: 'right' },
      { index: 6, origin: 'right' },
      { index: 7, origin: 'right' },
      { index: 8, origin: 'right' },
    ])
  })
})
