import { describe, it, expect } from 'vitest'

import nextOpenPanel from '../../src/utils/navRail'

type PanelId = 'docs' | 'scenes'

describe('nextOpenPanel', () => {
  it('collapses the panel when the open menu item is clicked', () => {
    expect(nextOpenPanel<PanelId>('docs', 'docs')).toBeNull()
  })

  it('opens the clicked menu item when the panel is collapsed', () => {
    expect(nextOpenPanel<PanelId>(null, 'docs')).toBe('docs')
  })

  it('switches to the clicked menu item when another one is open', () => {
    expect(nextOpenPanel<PanelId>('docs', 'scenes')).toBe('scenes')
  })
})
