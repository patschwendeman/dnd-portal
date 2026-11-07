import { noteHeadings } from './noteAnchors'
import { noteFolderOf } from './noteFolders'

/** Anchors of every known note file, keyed by its path relative to public/story/ */
export type NoteIndex = Map<string, Set<string>>

/** Anchors of the headings of every file, so links can be checked without rendering the target */
export const buildNoteIndex = (files: { path: string, text: string }[]): NoteIndex => new Map(
  files.map(({ path, text }) => [path, new Set(noteHeadings(text).map(({ anchor }) => anchor))]),
)

export interface NoteTarget {
  path: string
  /** null: the start of the file */
  anchor: string | null
}

export type ResolvedLink = | { kind: 'note', target: NoteTarget }
  | { kind: 'external' }
  | { kind: 'broken', reason: 'missing-file' | 'missing-anchor' | 'ambiguous-anchor' }
  // Images and anything else that is neither a note nor a web page stays a plain link
  | { kind: 'other' }

const EXTERNAL = /^https?:\/\//i
const NOTE_FILE = /\.md$/i

const directoryOf = (path: string): string[] => path.split('/').slice(0, -1)

// null when the path leaves public/story/
const joinPath = (directory: string[], relative: string): string | null => {
  const segments = [...directory]
  const parts = relative.split('/')
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]
    if (part === '..') {
      if (segments.length === 0) {
        return null
      }
      segments.pop()
    } else if (part !== '.' && part !== '') {
      segments.push(part)
    }
  }
  return segments.join('/')
}

const decode = (text: string): string => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

// A bare #anchor first means the own file; otherwise exactly one file of the same folder must
// have it, so the tables of contents keep working without a file name
const resolveBareAnchor = (
  sourcePath: string,
  anchor: string,
  index: NoteIndex,
): ResolvedLink => {
  if (index.get(sourcePath)?.has(anchor)) {
    return { kind: 'note', target: { path: sourcePath, anchor } }
  }
  const folder = noteFolderOf(sourcePath)
  const matches = [...index.entries()]
    .filter(([path, anchors]) => noteFolderOf(path) === folder && anchors.has(anchor))
  if (matches.length === 1) {
    return { kind: 'note', target: { path: matches[0][0], anchor } }
  }
  return { kind: 'broken', reason: matches.length > 1 ? 'ambiguous-anchor' : 'missing-anchor' }
}

export const resolveNoteLink = (
  sourcePath: string,
  href: string,
  index: NoteIndex,
): ResolvedLink => {
  if (EXTERNAL.test(href)) {
    return { kind: 'external' }
  }
  const hashAt = href.indexOf('#')
  const file = decode(hashAt === -1 ? href : href.slice(0, hashAt))
  const anchor = hashAt === -1 ? null : decode(href.slice(hashAt + 1))

  if (file === '') {
    if (anchor === null) {
      return { kind: 'other' }
    }
    return anchor === ''
      ? { kind: 'broken', reason: 'missing-anchor' }
      : resolveBareAnchor(sourcePath, anchor, index)
  }
  if (!NOTE_FILE.test(file)) {
    return { kind: 'other' }
  }
  const path = file.startsWith('/') ? null : joinPath(directoryOf(sourcePath), file)
  const anchors = path === null ? undefined : index.get(path)
  if (path === null || anchors === undefined) {
    return { kind: 'broken', reason: 'missing-file' }
  }
  if (anchor === null || anchor === '') {
    return { kind: 'note', target: { path, anchor: null } }
  }
  return anchors.has(anchor)
    ? { kind: 'note', target: { path, anchor } }
    : { kind: 'broken', reason: 'missing-anchor' }
}
