const UMLAUTS: [RegExp, string][] = [[/ä/g, 'ae'], [/ö/g, 'oe'], [/ü/g, 'ue'], [/ß/g, 'ss']]

/** Replaces character by character, so anchors of headings without umlauts stay stable */
export const headingAnchor = (text: string): string => UMLAUTS
  .reduce((anchor, [umlaut, spelling]) => anchor.replace(umlaut, spelling), text.toLowerCase())
  .replace(/[^a-z0-9_]/g, '-')

/** Repeated headings of a file get -2, -3 …, so every anchor leads to exactly one heading */
export const uniqueAnchors = (anchors: string[]): string[] => {
  const used = new Set<string>()
  return anchors.map((anchor) => {
    let unique = anchor
    for (let count = 2; used.has(unique); count += 1) {
      unique = `${anchor}-${count}`
    }
    used.add(unique)
    return unique
  })
}

export interface NoteHeading {
  /** 1-based, like the source positions of react-markdown */
  line: number
  anchor: string
}

const ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/
const FENCE = /^ {0,3}(```|~~~)/
const INLINE_LINK = /!?\[([^\]]*)\]\([^)]*\)/g
const INLINE_MARKS = /[*`]/g

// The text react-markdown renders for the usual headings: links and images reduced to their text,
// emphasis and code marks dropped
const headingText = (raw: string): string => raw
  .replace(INLINE_LINK, '$1')
  .replace(INLINE_MARKS, '')
  .trim()

export const noteHeadings = (markdown: string): NoteHeading[] => {
  const found: { line: number, text: string }[] = []
  let isInFence = false
  markdown.split(/\r?\n/).forEach((content, index) => {
    if (FENCE.test(content)) {
      isInFence = !isInFence
      return
    }
    const match = isInFence ? null : ATX_HEADING.exec(content)
    if (match) {
      found.push({ line: index + 1, text: headingText(match[1] ?? '') })
    }
  })
  const anchors = uniqueAnchors(found.map(({ text }) => headingAnchor(text)))
  return found.map(({ line }, index) => ({ line, anchor: anchors[index] }))
}

/** Unique in the whole page, also for the same heading in several files of a folder */
export const noteElementId = (path: string, anchor: string | null = null): string => {
  const file = path.replace(/\.md$/, '').replace(/[^A-Za-z0-9_-]/g, '-')
  return anchor === null ? `note-${file}` : `note-${file}--${anchor}`
}
