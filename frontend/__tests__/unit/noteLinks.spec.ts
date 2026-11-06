import { describe, it, expect } from 'vitest'

import { buildNoteIndex, resolveNoteLink } from '../../src/notes/noteLinks'

const index = buildNoteIndex([
  { path: 'leveling/1_tableOfContent.md', text: '# Inhaltsverzeichnis' },
  { path: 'leveling/level_1.md', text: '# Level_1\n## Paladin' },
  { path: 'leveling/level_2.md', text: '# Level_2\n## Paladin' },
  { path: 'mechanics/rest.md', text: '# Rasten' },
  { path: 'mechanics/armor.md', text: '# Rüstungsklasse' },
])

const SOURCE = 'leveling/1_tableOfContent.md'

describe('resolveNoteLink', () => {
  it('resolves a file in the same folder', () => {
    expect(resolveNoteLink(SOURCE, 'level_1.md', index)).toEqual(
      { kind: 'note', target: { path: 'leveling/level_1.md', anchor: null } },
    )
    expect(resolveNoteLink(SOURCE, './level_2.md#paladin', index)).toEqual(
      { kind: 'note', target: { path: 'leveling/level_2.md', anchor: 'paladin' } },
    )
  })

  it('resolves a file in another folder, with and without anchor', () => {
    expect(resolveNoteLink(SOURCE, '../mechanics/rest.md', index)).toEqual(
      { kind: 'note', target: { path: 'mechanics/rest.md', anchor: null } },
    )
    expect(resolveNoteLink(SOURCE, '../mechanics/rest.md#rasten', index)).toEqual(
      { kind: 'note', target: { path: 'mechanics/rest.md', anchor: 'rasten' } },
    )
  })

  it('resolves an anchor with written-out umlauts', () => {
    expect(resolveNoteLink(SOURCE, '../mechanics/armor.md#ruestungsklasse', index)).toEqual(
      { kind: 'note', target: { path: 'mechanics/armor.md', anchor: 'ruestungsklasse' } },
    )
  })

  it('prefers the own file for a bare anchor', () => {
    expect(resolveNoteLink('leveling/level_1.md', '#paladin', index)).toEqual(
      { kind: 'note', target: { path: 'leveling/level_1.md', anchor: 'paladin' } },
    )
  })

  it('resolves a bare anchor that exactly one file of the folder has', () => {
    expect(resolveNoteLink(SOURCE, '#level_2', index)).toEqual(
      { kind: 'note', target: { path: 'leveling/level_2.md', anchor: 'level_2' } },
    )
  })

  it('reports a bare anchor of several files as ambiguous', () => {
    expect(resolveNoteLink(SOURCE, '#paladin', index))
      .toEqual({ kind: 'broken', reason: 'ambiguous-anchor' })
  })

  it('does not look for a bare anchor in other folders', () => {
    expect(resolveNoteLink(SOURCE, '#rasten', index))
      .toEqual({ kind: 'broken', reason: 'missing-anchor' })
  })

  it('reports missing files and anchors', () => {
    expect(resolveNoteLink(SOURCE, 'level_9.md', index))
      .toEqual({ kind: 'broken', reason: 'missing-file' })
    expect(resolveNoteLink(SOURCE, '../mechanics/rest.md#rast', index))
      .toEqual({ kind: 'broken', reason: 'missing-anchor' })
    expect(resolveNoteLink(SOURCE, '#nothing', index))
      .toEqual({ kind: 'broken', reason: 'missing-anchor' })
    expect(resolveNoteLink(SOURCE, '#', index))
      .toEqual({ kind: 'broken', reason: 'missing-anchor' })
  })

  it('reports paths that leave the notes or are absolute', () => {
    expect(resolveNoteLink(SOURCE, '../../mechanics/rest.md', index))
      .toEqual({ kind: 'broken', reason: 'missing-file' })
    expect(resolveNoteLink(SOURCE, '/story/mechanics/rest.md', index))
      .toEqual({ kind: 'broken', reason: 'missing-file' })
  })

  it('treats web links as external', () => {
    expect(resolveNoteLink(SOURCE, 'https://roll20.net/compendium/dnd5e/Paladin#toc_5', index))
      .toEqual({ kind: 'external' })
    expect(resolveNoteLink(SOURCE, 'http://example.com/notes.md', index))
      .toEqual({ kind: 'external' })
  })

  it('leaves links that point neither to a note nor to an anchor alone', () => {
    expect(resolveNoteLink(SOURCE, 'assets/room_2.png', index)).toEqual({ kind: 'other' })
    expect(resolveNoteLink(SOURCE, 'mailto:gm@example.com', index)).toEqual({ kind: 'other' })
  })
})
