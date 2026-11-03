import { describe, it, expect } from 'vitest'

import {
  adventureBackgroundLayers,
  adventureBackgroundReducer,
  adventureBackgroundSource,
  AdventureBackgroundAction,
  AdventureBackgroundState,
  initialAdventureBackground,
  isBackgroundImageShown,
} from '../../src/utils/adventureBackground'
import { AdventureDetail } from '../../src/models/models'

const FOREST = '/media/images/wall_screen/forest.jpg'
const SHOP = '/media/images/wall_screen/shop.jpg'

const FIGHT_IMAGE = { id: 2, name: 'Fight', source: '/media/images/wall_screen/fight.jpg' }
const TAVERN_IMAGE = { id: 4, name: 'Tavern', source: '/media/images/wall_screen/tavern.jpg' }
const SHOP_IMAGE = { id: 3, name: 'Shop', source: SHOP }

const adventure = (overrides: Partial<AdventureDetail> = {}): AdventureDetail => ({
  id: 1,
  name: 'Erstes Abenteuer',
  description: null,
  global_level: 1,
  active_scene_id: null,
  players: [],
  background_dark: FIGHT_IMAGE,
  background_tavern: TAVERN_IMAGE,
  ...overrides,
})

const run = (state: AdventureBackgroundState, ...actions: AdventureBackgroundAction[]) => (
  actions.reduce(adventureBackgroundReducer, state)
)

const showing = (src: string): AdventureBackgroundState => run(
  initialAdventureBackground(src),
  { type: 'loaded', src },
)

describe('adventureBackgroundSource', () => {
  it('takes the image of the adventure for the theme', () => {
    expect(adventureBackgroundSource(adventure(), 'dark')).toBe(FIGHT_IMAGE.source)
    expect(adventureBackgroundSource(adventure(), 'tavern')).toBe(TAVERN_IMAGE.source)
  })

  it('has no image while the adventure loads', () => {
    expect(adventureBackgroundSource(undefined, 'dark')).toBeNull()
    expect(adventureBackgroundSource(undefined, 'tavern')).toBeNull()
  })

  it('has no image without an image for the theme', () => {
    const withoutTavern = adventure({ background_tavern: null })
    expect(adventureBackgroundSource(withoutTavern, 'tavern')).toBeNull()
    expect(adventureBackgroundSource(withoutTavern, 'dark')).toBe(FIGHT_IMAGE.source)
  })

  it('changes with the adventure', () => {
    const other = adventure({ id: 2, background_dark: SHOP_IMAGE })
    expect(adventureBackgroundSource(other, 'dark')).toBe(SHOP)
  })

  it('keeps the image when the active scene changes', () => {
    const reloaded = adventure({ active_scene_id: 8 })
    expect(adventureBackgroundSource(reloaded, 'dark'))
      .toBe(adventureBackgroundSource(adventure(), 'dark'))
  })
})

describe('adventureBackgroundReducer', () => {
  it('shows no image without an image for the theme', () => {
    const state = initialAdventureBackground(null)
    expect(isBackgroundImageShown(state)).toBe(false)
    expect(adventureBackgroundLayers(state)).toEqual([])
  })

  it('renders an image that is loading but does not show it yet', () => {
    const state = initialAdventureBackground(FOREST)
    expect(isBackgroundImageShown(state)).toBe(false)
    expect(state.shown).toBeNull()
    expect(adventureBackgroundLayers(state)).toEqual([FOREST])
  })

  it('shows the image once it is loaded', () => {
    const state = showing(FOREST)
    expect(isBackgroundImageShown(state)).toBe(true)
    expect(state.shown).toBe(FOREST)
    expect(adventureBackgroundLayers(state)).toEqual([FOREST])
  })

  it('stays plain when the image cannot be loaded', () => {
    const state = run(initialAdventureBackground(FOREST), { type: 'failed', src: FOREST })
    expect(isBackgroundImageShown(state)).toBe(false)
    expect(adventureBackgroundLayers(state)).toEqual([])
  })

  it('keeps the old image while the new one loads', () => {
    const state = run(showing(FOREST), { type: 'target', src: SHOP })
    expect(state.shown).toBe(FOREST)
    expect(adventureBackgroundLayers(state)).toEqual([FOREST, SHOP])
  })

  it('fades from the old to the new image once the new one is loaded', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'loaded', src: SHOP },
    )
    expect(state.shown).toBe(SHOP)
    expect(state.leaving).toBe(FOREST)
    expect(adventureBackgroundLayers(state)).toEqual([FOREST, SHOP])
  })

  it('drops the old image after its fade-out', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'loaded', src: SHOP },
      { type: 'settled', src: FOREST },
    )
    expect(adventureBackgroundLayers(state)).toEqual([SHOP])
  })

  it('turns plain when the new image cannot be loaded', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'failed', src: SHOP },
    )
    expect(isBackgroundImageShown(state)).toBe(false)
    expect(state.leaving).toBe(FOREST)
  })

  it('fades out to the plain background when the image is gone', () => {
    const state = run(showing(FOREST), { type: 'target', src: null })
    expect(isBackgroundImageShown(state)).toBe(false)
    expect(adventureBackgroundLayers(state)).toEqual([FOREST])
    expect(adventureBackgroundLayers(run(state, { type: 'settled', src: FOREST }))).toEqual([])
  })

  it('ignores an image that loads after the image changed again', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'target', src: FOREST },
      { type: 'loaded', src: SHOP },
    )
    expect(state.shown).toBe(FOREST)
    expect(adventureBackgroundLayers(state)).toEqual([FOREST])
  })

  it('shows a fading image again at once when it comes back', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: null },
      { type: 'target', src: FOREST },
    )
    expect(state.shown).toBe(FOREST)
    expect(state.leaving).toBeNull()
  })
})
