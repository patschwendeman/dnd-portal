import { describe, it, expect } from 'vitest'

import {
  initialSceneBackground,
  isSceneImageShown,
  sceneBackgroundLayers,
  sceneBackgroundReducer,
  SceneBackgroundAction,
  SceneBackgroundState,
} from '../../src/utils/sceneBackground'

const FOREST = '/media/images/wall_screen/forest.jpg'
const SHOP = '/media/images/wall_screen/shop.jpg'

const run = (state: SceneBackgroundState, ...actions: SceneBackgroundAction[]) => (
  actions.reduce(sceneBackgroundReducer, state)
)

const showing = (src: string): SceneBackgroundState => run(
  initialSceneBackground(src),
  { type: 'loaded', src },
)

describe('sceneBackgroundReducer', () => {
  it('shows no image without an active scene', () => {
    const state = initialSceneBackground(null)
    expect(isSceneImageShown(state)).toBe(false)
    expect(sceneBackgroundLayers(state)).toEqual([])
  })

  it('renders the image of a loading scene but does not show it yet', () => {
    const state = initialSceneBackground(FOREST)
    expect(isSceneImageShown(state)).toBe(false)
    expect(state.shown).toBeNull()
    expect(sceneBackgroundLayers(state)).toEqual([FOREST])
  })

  it('shows the image once it is loaded', () => {
    const state = showing(FOREST)
    expect(isSceneImageShown(state)).toBe(true)
    expect(state.shown).toBe(FOREST)
    expect(sceneBackgroundLayers(state)).toEqual([FOREST])
  })

  it('stays plain when the image cannot be loaded', () => {
    const state = run(initialSceneBackground(FOREST), { type: 'failed', src: FOREST })
    expect(isSceneImageShown(state)).toBe(false)
    expect(sceneBackgroundLayers(state)).toEqual([])
  })

  it('keeps the old image while the image of the new scene loads', () => {
    const state = run(showing(FOREST), { type: 'target', src: SHOP })
    expect(state.shown).toBe(FOREST)
    expect(sceneBackgroundLayers(state)).toEqual([FOREST, SHOP])
  })

  it('fades from the old to the new image once the new one is loaded', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'loaded', src: SHOP },
    )
    expect(state.shown).toBe(SHOP)
    expect(state.leaving).toBe(FOREST)
    expect(sceneBackgroundLayers(state)).toEqual([FOREST, SHOP])
  })

  it('drops the old image after its fade-out', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'loaded', src: SHOP },
      { type: 'settled', src: FOREST },
    )
    expect(sceneBackgroundLayers(state)).toEqual([SHOP])
  })

  it('turns plain when the image of the new scene cannot be loaded', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'failed', src: SHOP },
    )
    expect(isSceneImageShown(state)).toBe(false)
    expect(state.leaving).toBe(FOREST)
  })

  it('fades out to the plain background when the scene is gone', () => {
    const state = run(showing(FOREST), { type: 'target', src: null })
    expect(isSceneImageShown(state)).toBe(false)
    expect(sceneBackgroundLayers(state)).toEqual([FOREST])
    expect(sceneBackgroundLayers(run(state, { type: 'settled', src: FOREST }))).toEqual([])
  })

  it('ignores an image that loads after the scene changed again', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: SHOP },
      { type: 'target', src: FOREST },
      { type: 'loaded', src: SHOP },
    )
    expect(state.shown).toBe(FOREST)
    expect(sceneBackgroundLayers(state)).toEqual([FOREST])
  })

  it('shows a fading image again at once when its scene comes back', () => {
    const state = run(
      showing(FOREST),
      { type: 'target', src: null },
      { type: 'target', src: FOREST },
    )
    expect(state.shown).toBe(FOREST)
    expect(state.leaving).toBeNull()
  })
})
