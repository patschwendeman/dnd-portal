import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

import { NOTE_FILES } from '../../src/notes/noteFolders'
import { buildNoteIndex, resolveNoteLink } from '../../src/notes/noteLinks'

interface NoteFile {
  path: string
  text: string
}

// Inline links, not images; the optional title after the target is dropped
const LINK = /(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g
const FENCED_CODE = /^ {0,3}(```|~~~)[\s\S]*?^ {0,3}\1/gm

// "<file>: <link> (<reason>)" for every internal link without a target
const findBrokenLinks = (files: NoteFile[]): string[] => {
  const index = buildNoteIndex(files)
  return files.flatMap(({ path, text }) => [...text.replace(FENCED_CODE, '').matchAll(LINK)]
    .map((match) => match[1])
    .flatMap((href) => {
      const link = resolveNoteLink(path, href, index)
      return link.kind === 'broken' ? [`${path}: ${href} (${link.reason})`] : []
    }))
}

const storyFiles = (): NoteFile[] => NOTE_FILES.map((path) => ({
  path,
  text: readFileSync(new URL(`../../public/story/${path}`, import.meta.url), 'utf8'),
}))

describe('links in public/story/', () => {
  it('finds the notes of every folder', () => {
    const folders = new Set(NOTE_FILES.map((path) => path.split('/')[0]))
    expect([...folders].sort()).toEqual(['fight', 'leveling', 'main', 'mechanics'])
  })

  it('resolves every internal link to exactly one target', () => {
    expect(findBrokenLinks(storyFiles())).toEqual([])
  })

  it('names file and link of a broken link', () => {
    const files = [
      ...storyFiles().filter(({ path }) => path === 'mechanics/rest.md'),
      {
        path: 'leveling/broken.md',
        text: '[Rast](../mechanics/rest.md#rast) ![Bild](assets/x.png) [Web](https://x.de)',
      },
    ]
    expect(findBrokenLinks(files))
      .toEqual(['leveling/broken.md: ../mechanics/rest.md#rast (missing-anchor)'])
  })
})
