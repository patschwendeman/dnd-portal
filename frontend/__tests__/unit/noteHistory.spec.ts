import { describe, it, expect } from 'vitest'

import {
  canGoBack,
  canGoForward,
  currentNoteEntry,
  goBack,
  goForward,
  initialNoteHistory,
  NOTE_HISTORY_LIMIT,
  NoteHistory,
  pushNoteEntry,
  selectNoteFolder,
} from '../../src/notes/noteHistory'

const REST = { path: 'mechanics/rest.md', anchor: 'rasten' }

// Leveling scrolled to 300, then the link to "Rasten"
const afterLink = (): NoteHistory => pushNoteEntry(
  selectNoteFolder(initialNoteHistory, 0, 'leveling'),
  300,
  'mechanics',
  REST,
)

describe('note history', () => {
  it('starts with Main and nowhere to go', () => {
    expect(currentNoteEntry(initialNoteHistory))
      .toEqual({ folderId: 'main', target: null, scrollTop: null })
    expect(canGoBack(initialNoteHistory)).toBe(false)
    expect(canGoForward(initialNoteHistory)).toBe(false)
  })

  it('pushes a link and saves the position of the entry it leaves', () => {
    const history = afterLink()
    expect(history.entries).toEqual([
      { folderId: 'main', target: null, scrollTop: 0 },
      { folderId: 'leveling', target: null, scrollTop: 300 },
      { folderId: 'mechanics', target: REST, scrollTop: null },
    ])
    expect(canGoBack(history)).toBe(true)
    expect(canGoForward(history)).toBe(false)
  })

  it('goes back and forward and keeps the position of each entry', () => {
    const back = goBack(afterLink(), 120)
    expect(currentNoteEntry(back)).toEqual({ folderId: 'leveling', target: null, scrollTop: 300 })
    expect(canGoForward(back)).toBe(true)
    const forward = goForward(back, 300)
    expect(currentNoteEntry(forward))
      .toEqual({ folderId: 'mechanics', target: REST, scrollTop: 120 })
    expect(canGoForward(forward)).toBe(false)
  })

  it('stays put at the ends', () => {
    expect(goBack(initialNoteHistory, 50)).toBe(initialNoteHistory)
    const history = afterLink()
    expect(goForward(history, 50)).toBe(history)
  })

  it('counts every move', () => {
    const history = afterLink()
    expect(history.moves).toBe(2)
    expect(goForward(goBack(history, 0), 0).moves).toBe(4)
  })

  it('drops the entries ahead with a new move after going back', () => {
    const history = selectNoteFolder(goBack(afterLink(), 0), 300, 'fight')
    expect(history.entries.map((entry) => entry.folderId)).toEqual(['main', 'leveling', 'fight'])
    expect(canGoForward(history)).toBe(false)
  })

  it('adds no entry for the folder that is already shown', () => {
    const history = selectNoteFolder(initialNoteHistory, 200, 'main')
    expect(history).toBe(initialNoteHistory)
  })

  it('adds an entry for an anchor in the shown folder', () => {
    const shop = { path: 'main/shop.md', anchor: null }
    const history = pushNoteEntry(initialNoteHistory, 0, 'main', shop)
    expect(history.entries).toHaveLength(2)
  })

  it(`keeps at most ${NOTE_HISTORY_LIMIT} entries and drops the oldest`, () => {
    let history = initialNoteHistory
    for (let step = 1; step <= NOTE_HISTORY_LIMIT + 5; step += 1) {
      history = pushNoteEntry(history, step, step % 2 === 0 ? 'main' : 'fight', null)
    }
    expect(history.entries).toHaveLength(NOTE_HISTORY_LIMIT)
    expect(history.index).toBe(NOTE_HISTORY_LIMIT - 1)
    // The start and the entries of the first five moves are gone; the oldest kept one came with
    // move 6 and was left at 7
    expect(history.entries[0].scrollTop).toBe(7)
  })
})
