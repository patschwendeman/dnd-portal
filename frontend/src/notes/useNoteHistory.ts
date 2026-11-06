import {
  RefObject, useCallback, useEffect, useState,
} from 'react'

import { HistoryStep, keyHistoryStep, mouseHistoryStep } from './historyShortcuts'
import { NoteFolderId, noteFolderIdOf } from './noteFolders'
import {
  canGoBack,
  canGoForward,
  currentNoteEntry,
  goBack,
  goForward,
  initialNoteHistory,
  NoteHistoryEntry,
  pushNoteEntry,
  selectNoteFolder,
} from './noteHistory'
import { NoteTarget } from './noteLinks'

export interface NoteHistoryControl {
  entry: NoteHistoryEntry
  moves: number
  canGoBack: boolean
  canGoForward: boolean
  back: () => void
  forward: () => void
  selectFolder: (folderId: NoteFolderId) => void
  follow: (target: NoteTarget) => void
}

// Only in memory: no URL, no browser history, no localStorage; after a reload Main is open
export function useNoteHistory(scrollRef: RefObject<HTMLElement>): NoteHistoryControl {
  const [history, setHistory] = useState(initialNoteHistory)

  const scrollTop = useCallback(() => scrollRef.current?.scrollTop ?? 0, [scrollRef])

  const back = useCallback(() => {
    const top = scrollTop()
    setHistory((current) => goBack(current, top))
  }, [scrollTop])

  const forward = useCallback(() => {
    const top = scrollTop()
    setHistory((current) => goForward(current, top))
  }, [scrollTop])

  const selectFolder = useCallback((folderId: NoteFolderId) => {
    const top = scrollTop()
    setHistory((current) => selectNoteFolder(current, top, folderId))
  }, [scrollTop])

  const follow = useCallback((target: NoteTarget) => {
    const folderId = noteFolderIdOf(target.path)
    if (folderId === null) {
      return
    }
    const top = scrollTop()
    setHistory((current) => pushNoteEntry(current, top, folderId, target))
  }, [scrollTop])

  return {
    entry: currentNoteEntry(history),
    moves: history.moves,
    canGoBack: canGoBack(history),
    canGoForward: canGoForward(history),
    back,
    forward,
    selectFolder,
    follow,
  }
}

// In the whole Admin window; the browser must not leave the Admin, also without a target in the
// history
export function useHistoryShortcuts(onStep: (step: HistoryStep) => void): void {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const step = keyHistoryStep(event)
      if (step !== null) {
        event.preventDefault()
        onStep(step)
      }
    }
    // Browsers navigate on mousedown or mouseup of the thumb buttons, so both are prevented
    const preventMouse = (event: MouseEvent) => {
      if (mouseHistoryStep(event.button) !== null) {
        event.preventDefault()
      }
    }
    const handleMouseUp = (event: MouseEvent) => {
      const step = mouseHistoryStep(event.button)
      if (step !== null) {
        event.preventDefault()
        onStep(step)
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', preventMouse)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', preventMouse)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onStep])
}
