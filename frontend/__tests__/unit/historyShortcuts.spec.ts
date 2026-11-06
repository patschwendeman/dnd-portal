import { describe, it, expect } from 'vitest'

import { keyHistoryStep, mouseHistoryStep } from '../../src/notes/historyShortcuts'

const key = (name: string, overrides: Partial<Parameters<typeof keyHistoryStep>[0]> = {}) => ({
  key: name,
  altKey: true,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  target: null,
  ...overrides,
})

const focused = (element: object): EventTarget => element as EventTarget

describe('keyHistoryStep', () => {
  it('maps Alt+← to back and Alt+→ to forward', () => {
    expect(keyHistoryStep(key('ArrowLeft'))).toBe('back')
    expect(keyHistoryStep(key('ArrowRight'))).toBe('forward')
  })

  it('ignores the arrows without Alt or with other modifiers', () => {
    expect(keyHistoryStep(key('ArrowLeft', { altKey: false }))).toBeNull()
    expect(keyHistoryStep(key('ArrowLeft', { ctrlKey: true }))).toBeNull()
    expect(keyHistoryStep(key('ArrowRight', { metaKey: true }))).toBeNull()
    expect(keyHistoryStep(key('ArrowRight', { shiftKey: true }))).toBeNull()
    expect(keyHistoryStep(key('ArrowUp'))).toBeNull()
  })

  it('leaves Alt+←/→ to a focused text field', () => {
    ['INPUT', 'TEXTAREA', 'SELECT', 'input'].forEach((tagName) => {
      expect(keyHistoryStep(key('ArrowLeft', { target: focused({ tagName }) }))).toBeNull()
    })
    const editable = focused({ tagName: 'DIV', isContentEditable: true })
    expect(keyHistoryStep(key('ArrowRight', { target: editable }))).toBeNull()
  })

  it('works while a button or the page has the focus', () => {
    const button = focused({ tagName: 'BUTTON', isContentEditable: false })
    expect(keyHistoryStep(key('ArrowLeft', { target: button }))).toBe('back')
  })
})

describe('mouseHistoryStep', () => {
  it('maps the thumb buttons 3 and 4', () => {
    expect(mouseHistoryStep(3)).toBe('back')
    expect(mouseHistoryStep(4)).toBe('forward')
  })

  it('ignores the other buttons', () => {
    [0, 1, 2].forEach((button) => expect(mouseHistoryStep(button)).toBeNull())
  })
})
