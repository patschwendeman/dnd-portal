export type HistoryStep = 'back' | 'forward'

interface ShortcutKeyEvent {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
}

interface FocusTarget {
  tagName?: string
  isContentEditable?: boolean
}

const TEXT_FIELD_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

const isTextField = (target: EventTarget | null): boolean => {
  const element = target as FocusTarget | null
  return element !== null && (
    TEXT_FIELD_TAGS.includes(element.tagName?.toUpperCase() ?? '')
    || element.isContentEditable === true
  )
}

/** Alt+←/→ like in the browser; in a text field they stay with the field (e.g. word by word) */
export const keyHistoryStep = (event: ShortcutKeyEvent): HistoryStep | null => {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
    || isTextField(event.target)) {
    return null
  }
  if (event.key === 'ArrowLeft') {
    return 'back'
  }
  return event.key === 'ArrowRight' ? 'forward' : null
}

/** The thumb buttons of a mouse (MouseEvent.button 3 and 4) */
export const mouseHistoryStep = (button: number): HistoryStep | null => {
  if (button === 3) {
    return 'back'
  }
  return button === 4 ? 'forward' : null
}
