import { describe, it, expect } from 'vitest'

import {
  headingAnchor, noteElementId, noteHeadings, uniqueAnchors,
} from '../../src/notes/noteAnchors'

describe('headingAnchor', () => {
  it('writes umlauts and ß out', () => {
    expect(headingAnchor('Rüstungsklasse')).toBe('ruestungsklasse')
    expect(headingAnchor('Ärger, Öl und Größe')).toBe('aerger--oel-und-groesse')
    expect(headingAnchor('Fuß')).toBe('fuss')
  })

  it('replaces every other character by a hyphen, one for one', () => {
    expect(headingAnchor('Taverne – Zum Verzauberte Krug')).toBe('taverne---zum-verzauberte-krug')
    expect(headingAnchor('Kritischer Erfolg (20)')).toBe('kritischer-erfolg--20-')
  })

  it('keeps digits and underscores', () => {
    expect(headingAnchor('Level_1')).toBe('level_1')
  })
})

describe('uniqueAnchors', () => {
  it('numbers repeated anchors from 2 on', () => {
    expect(uniqueAnchors(['kampf', 'loot', 'kampf', 'kampf'])).toEqual(
      ['kampf', 'loot', 'kampf-2', 'kampf-3'],
    )
  })

  it('skips a number that a heading already uses', () => {
    expect(uniqueAnchors(['a', 'a-2', 'a'])).toEqual(['a', 'a-2', 'a-3'])
  })
})

describe('noteHeadings', () => {
  it('finds the headings with their lines and unique anchors', () => {
    const markdown = '# Raum_8\n\n## Kampf\ntext\n## Türe\n\n## Kampf'
    expect(noteHeadings(markdown)).toEqual([
      { line: 1, anchor: 'raum_8' },
      { line: 3, anchor: 'kampf' },
      { line: 5, anchor: 'tuere' },
      { line: 7, anchor: 'kampf-2' },
    ])
  })

  it('ignores headings in code blocks, closing hashes and inline marks', () => {
    const markdown = '```\n# no heading\n```\n## **Rasten** ##\n#### [Dialog](x.md)'
    expect(noteHeadings(markdown)).toEqual([
      { line: 4, anchor: 'rasten' },
      { line: 5, anchor: 'dialog' },
    ])
  })

  it('needs a space after the hashes', () => {
    expect(noteHeadings('#hashtag')).toEqual([])
  })
})

describe('noteElementId', () => {
  it('prefixes the anchor with folder and file', () => {
    expect(noteElementId('mechanics/rest.md', 'rasten')).toBe('note-mechanics-rest--rasten')
    expect(noteElementId('main/shop.md', 'dialog'))
      .not.toBe(noteElementId('main/tavern.md', 'dialog'))
  })

  it('names the file itself without an anchor', () => {
    expect(noteElementId('main/dialog.md')).toBe('note-main-dialog')
  })
})
