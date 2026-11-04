import { describe, it, expect } from 'vitest'

import { nextOpenPanel, splitByPlacement } from '../../src/utils/navRail'

type PanelId = 'docs' | 'scenes' | 'fight' | 'settings'

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

  it('opens and collapses the panel of the fight like the others', () => {
    expect(nextOpenPanel<PanelId>('scenes', 'fight')).toBe('fight')
    expect(nextOpenPanel<PanelId>('fight', 'fight')).toBeNull()
  })

  it('opens, switches and collapses the panel of the settings like the others', () => {
    expect(nextOpenPanel<PanelId>('docs', 'settings')).toBe('settings')
    expect(nextOpenPanel<PanelId>('settings', 'scenes')).toBe('scenes')
    expect(nextOpenPanel<PanelId>('settings', 'settings')).toBeNull()
  })
})

describe('splitByPlacement', () => {
  it('puts items without placement at the top and keeps the order', () => {
    const items: { id: string, placement?: 'top' | 'bottom' }[] = [
      { id: 'docs' },
      { id: 'settings', placement: 'bottom' },
      { id: 'scenes', placement: 'top' },
      { id: 'fight' },
    ]

    const { top, bottom } = splitByPlacement(items)

    expect(top.map((item) => item.id)).toEqual(['docs', 'scenes', 'fight'])
    expect(bottom.map((item) => item.id)).toEqual(['settings'])
  })

  it('returns no bottom items when none is placed there', () => {
    const items: { id: string, placement?: 'top' | 'bottom' }[] = [{ id: 'docs' }, { id: 'scenes' }]

    expect(splitByPlacement(items).bottom).toEqual([])
  })
})
