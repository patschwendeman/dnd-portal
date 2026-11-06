import { DEFAULT_NOTE_FOLDER_ID, NoteFolderId } from './noteFolders'
import { NoteTarget } from './noteLinks'

export const NOTE_HISTORY_LIMIT = 50

export interface NoteHistoryEntry {
  folderId: NoteFolderId
  // Where a link pointed to; null for the start of the folder
  target: NoteTarget | null
  // Saved when the entry is left; once set, it wins over the target
  scrollTop: number | null
}

export interface NoteHistory {
  entries: NoteHistoryEntry[]
  index: number
  // Counts every move, so the reader also applies a move to an entry that looks like the last one
  moves: number
}

export const initialNoteHistory: NoteHistory = {
  entries: [{ folderId: DEFAULT_NOTE_FOLDER_ID, target: null, scrollTop: null }],
  index: 0,
  moves: 0,
}

export const currentNoteEntry = (history: NoteHistory): NoteHistoryEntry => (
  history.entries[history.index]
)

export const canGoBack = (history: NoteHistory): boolean => history.index > 0

export const canGoForward = (history: NoteHistory): boolean => (
  history.index < history.entries.length - 1
)

const withSavedScroll = (history: NoteHistory, scrollTop: number): NoteHistoryEntry[] => (
  history.entries.map((entry, index) => (index === history.index ? { ...entry, scrollTop } : entry))
)

// Like a browser: a new entry drops the entries ahead and, beyond the limit, the oldest ones
export const pushNoteEntry = (
  history: NoteHistory,
  scrollTop: number,
  folderId: NoteFolderId,
  target: NoteTarget | null,
): NoteHistory => {
  const kept = withSavedScroll(history, scrollTop).slice(0, history.index + 1)
  const entries = [...kept, { folderId, target, scrollTop: null }].slice(-NOTE_HISTORY_LIMIT)
  return { entries, index: entries.length - 1, moves: history.moves + 1 }
}

// The entry that is already shown gets no new entry
export const selectNoteFolder = (
  history: NoteHistory,
  scrollTop: number,
  folderId: NoteFolderId,
): NoteHistory => (
  currentNoteEntry(history).folderId === folderId
    ? history
    : pushNoteEntry(history, scrollTop, folderId, null)
)

const moveBy = (history: NoteHistory, scrollTop: number, step: -1 | 1): NoteHistory => {
  const index = history.index + step
  if (index < 0 || index >= history.entries.length) {
    return history
  }
  return { entries: withSavedScroll(history, scrollTop), index, moves: history.moves + 1 }
}

export const goBack = (history: NoteHistory, scrollTop: number): NoteHistory => (
  moveBy(history, scrollTop, -1)
)

export const goForward = (history: NoteHistory, scrollTop: number): NoteHistory => (
  moveBy(history, scrollTop, 1)
)
