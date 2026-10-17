import { describe, it, expect } from 'vitest'

import { createSceneAdoption } from '../../src/utils/sceneAdoption'

const ADVENTURE_A = 1
const ADVENTURE_B = 2

describe('createSceneAdoption', () => {
  it('takes over the stored scene on the first load', () => {
    const adoption = createSceneAdoption()
    expect(adoption.claim(ADVENTURE_A)).toBe(true)
  })

  it('does not take it over again when a retry reloads the same selection', () => {
    const adoption = createSceneAdoption()
    adoption.claim(ADVENTURE_A)
    expect(adoption.claim(ADVENTURE_A)).toBe(false)
  })

  it('takes it over after switching to another adventure and back', () => {
    const adoption = createSceneAdoption()
    adoption.claim(ADVENTURE_A)
    adoption.select()
    adoption.claim(ADVENTURE_B)
    adoption.select()
    expect(adoption.claim(ADVENTURE_A)).toBe(true)
  })

  it('takes it over when switching back before the other adventure was loaded', () => {
    const adoption = createSceneAdoption()
    adoption.claim(ADVENTURE_A)
    // B failed to load (or A was selected again before B finished), so B never claimed
    adoption.select()
    adoption.select()
    expect(adoption.claim(ADVENTURE_A)).toBe(true)
  })
})
