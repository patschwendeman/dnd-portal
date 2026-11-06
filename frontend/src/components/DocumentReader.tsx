import React, {
  createContext,
  MouseEvent,
  ReactElement,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { headingAnchor, noteElementId, noteHeadings } from '../notes/noteAnchors'
import {
  NOTE_FILES, NoteFolderId, noteFileUrl, noteFolderOf,
} from '../notes/noteFolders'
import { NoteHistoryEntry } from '../notes/noteHistory'
import {
  buildNoteIndex, NoteIndex, NoteTarget, resolveNoteLink,
} from '../notes/noteLinks'
import { hoverScrollbar, tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { loadLatest } from '../utils/loadSafely'

import arrowUpIcon from '/assets/icons/arrowUp.svg'

const LINE_MAX_WIDTH = '68ch'

const StoryReaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
`

const TopLink = styled.button<{ $isVisible: boolean }>`
  display: grid;
  place-items: center;
  position: absolute;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  border-radius: ${(props) => props.theme.radius.md};
  /* Floats above the tiles of the pages (surface secondary or secondaryTranslucent) */
  background-color: ${(props) => (props.theme.colors.background)};
  bottom: ${(props) => props.theme.space[4]};
  right: ${(props) => props.theme.space[4]};
  cursor: pointer;
  color: ${(props) => props.theme.colors.text.color} !important; 
  border: none;
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  

  svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
  `

const Background = styled.div`
  display: flex;
  gap: ${(props) => props.theme.space[5]};
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  /* No space at the top: the gap below the header keeps it, also while scrolling */
  padding: 0 0 ${(props) => props.theme.space[5]};
  scroll-behavior: smooth;
  ${hoverScrollbar}
`

const Page = styled.div<TileSurfaceProps>`
  ${tileSurface}
  width: 100%;
  padding: ${(props) => props.theme.space[7]} ${(props) => props.theme.space[8]};
  margin: 0;
`

const PageText = styled.div`
  max-width: ${LINE_MAX_WIDTH};
  margin: 0 auto;
  h1 {
    ${textStyle('2xl')}
    font-weight: ${(props) => props.theme.fontWeight.bold};
    margin: 0 0 ${(props) => props.theme.space[5]};
    padding-bottom: ${(props) => props.theme.space[3]};
    border-bottom: ${(props) => props.theme.borderWidth.thin} solid
      ${(props) => props.theme.colors.border};
  }
  h2 {
    ${textStyle('xl')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
    margin: ${(props) => props.theme.space[6]} 0 ${(props) => props.theme.space[3]};
  }
  h3, h4 {
    ${textStyle('md')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
    margin: ${(props) => props.theme.space[5]} 0 ${(props) => props.theme.space[2]};
  }
  h5, h6 {
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
    margin: ${(props) => props.theme.space[5]} 0 ${(props) => props.theme.space[2]};
  }
  p {
    ${textStyle('reading')}
    margin: 0 0 ${(props) => props.theme.space[4]};
    word-wrap: break-word;
  }
  ol {
    padding-left: ${(props) => props.theme.space[5]};
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.theme.space[2]};
  }
  ol ol {
    margin-top: ${(props) => props.theme.space[2]};
  }
  /* Loose list (table of contents): set paragraphs inside an entry like list lines */
  ol > li > p {
    ${textStyle('md')}
    margin: 0;
  }
  ol > li > p + p {
    margin-top: ${(props) => props.theme.space[2]};
  }
  ul {
    padding-left: ${(props) => props.theme.space[5]};
    display: block;
    list-style-type: disc;
    margin-block-start: 0;
    margin-block-end: ${(props) => props.theme.space[4]};
    ${textStyle('md')}
  }
  li {
    ${textStyle('md')}
  }
  a {
    text-decoration: none;
  }
  .broken-link {
    color: ${(props) => props.theme.colors.error};
    text-decoration: underline dotted;
    cursor: default;
  }
  .markdown-image {
    width: 100%;
    height: auto;
}
`

const LoadFailedText = styled.p`
  ${textStyle('reading')}
  max-width: ${LINE_MAX_WIDTH};
`

interface MarkdownImageProps {
  src?: string
  alt?: string
}

function MarkdownImage({ src = undefined, alt = '' }: MarkdownImageProps): ReactElement {
  return (
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img className="markdown-image" src={src} alt={alt} />
    </a>
  )
}

interface NoteFileContextValue {
  path: string
  // Anchor of each heading by its line in the file
  headingAnchors: Map<number, string>
  index: NoteIndex
  onFollow: (target: NoteTarget) => void
}

// The renderers are defined once (see markdownComponents), so they get their file from here
const NoteFileContext = createContext<NoteFileContextValue>({
  path: '',
  headingAnchors: new Map(),
  index: new Map(),
  onFollow: () => {},
})

interface SourceNode {
  position?: { start: { line: number } }
}

function flatten(text: string, child: React.ReactNode): string {
  if (typeof child === 'string') {
    return text + child
  }
  if (React.isValidElement(child) && child.props.children) {
    return React.Children.toArray(child.props.children).reduce(flatten, text)
  }
  return text
}

interface HeadingRendererProps {
  level: number
  node?: SourceNode
  children: React.ReactNode
}

function HeadingRenderer({
  level, node = undefined, children,
}: HeadingRendererProps): ReactElement {
  const { path, headingAnchors } = useContext(NoteFileContext)
  const line = node?.position?.start.line
  const anchor = (line !== undefined ? headingAnchors.get(line) : undefined)
    ?? headingAnchor(React.Children.toArray(children).reduce(flatten, ''))
  return React.createElement(`h${level}`, { id: noteElementId(path, anchor) }, children)
}

interface NoteLinkProps {
  href?: string
  children?: React.ReactNode
}

function NoteLink({ href = '', children = undefined }: NoteLinkProps): ReactElement {
  const { path, index, onFollow } = useContext(NoteFileContext)
  const link = resolveNoteLink(path, href, index)
  if (link.kind === 'external') {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
  }
  if (link.kind === 'broken') {
    return (
      <span className="broken-link" title="Verweis-Ziel nicht gefunden" data-test-id="broken-link">
        {children}
      </span>
    )
  }
  if (link.kind === 'other') {
    return <a href={href}>{children}</a>
  }
  // Through the history of the Admin instead of location.hash: URL and browser history stay
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onFollow(link.target)
  }
  return <a href={href} onClick={handleClick}>{children}</a>
}

// Defined once, so React keeps the rendered headings and images instead of remounting them
const markdownComponents: Components = {
  h1: (props) => <HeadingRenderer {...props} level={1} />,
  h2: (props) => <HeadingRenderer {...props} level={2} />,
  h3: (props) => <HeadingRenderer {...props} level={3} />,
  h4: (props) => <HeadingRenderer {...props} level={4} />,
  h5: (props) => <HeadingRenderer {...props} level={5} />,
  h6: (props) => <HeadingRenderer {...props} level={6} />,
  img: (props) => <MarkdownImage {...props} />,
  a: (props) => <NoteLink {...props} />,
}

const NO_HEADINGS = new Map<number, string>()

interface NotePageProps extends NoteFileContextValue {
  text: string
  isTranslucent: boolean
}

function NotePage({
  path, text, headingAnchors, index, onFollow, isTranslucent,
}: NotePageProps): ReactElement {
  const file = useMemo(() => ({
    path, headingAnchors, index, onFollow,
  }), [path, headingAnchors, index, onFollow])
  return (
    <Page id={noteElementId(path)} $isTranslucent={isTranslucent}>
      <PageText>
        <NoteFileContext.Provider value={file}>
          <ReactMarkdown components={markdownComponents}>
            {text || 'Loading...'}
          </ReactMarkdown>
        </NoteFileContext.Provider>
      </PageText>
    </Page>
  )
}

interface NoteFile {
  path: string
  text: string
}

// All folders at once: links into other folders need their anchors, and a jump does not wait
const loadNoteFiles = async (): Promise<NoteFile[]> => Promise.all(NOTE_FILES.map(async (path) => {
  const url = noteFileUrl(path)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Loading ${url} failed: HTTP ${response.status}`)
  }
  return { path, text: await response.text() }
}))

const prefersReducedMotion = (): boolean => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const targetTop = (container: HTMLElement, target: NoteTarget | null): number => {
  if (target === null) {
    return 0
  }
  const id = noteElementId(target.path, target.anchor)
  const element = container.querySelector(`#${CSS.escape(id)}`)
  if (element === null) {
    return 0
  }
  return element.getBoundingClientRect().top - container.getBoundingClientRect().top
    + container.scrollTop
}

interface DocumentReaderProps {
  // Folder and position to show, chosen in the panel, by a link or by "Zurück"/"Vor"
  entry: NoteHistoryEntry
  // Changes with every move in the history, so the reader applies the position once per move
  moves: number
  // The scroll area, so the history can save the position before a move
  scrollRef: RefObject<HTMLDivElement>
  onFollow: (target: NoteTarget) => void
  // While the scene image lies behind the tiles
  isTranslucent?: boolean
}

function DocumentReader({
  entry, moves, scrollRef, onFollow, isTranslucent = false,
}: DocumentReaderProps): ReactElement {
  const theme = useTheme()
  const [noteFiles, setNoteFiles] = useState<NoteFile[] | null>(null)
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState(false)
  const appliedMoves = useRef<number | null>(null)
  const shownFolderId = useRef<NoteFolderId | null>(null)

  // Loaded once; after a failure the next change of the entry tries again
  useEffect(() => {
    let stale = false

    if (noteFiles !== null) {
      return undefined
    }

    loadLatest(
      loadNoteFiles,
      (loaded) => {
        setNoteFiles(loaded)
        setLoadFailed(false)
      },
      (error) => {
        console.error('Error loading markdown files:', error)
        setLoadFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [noteFiles, entry.folderId])

  const index = useMemo(() => buildNoteIndex(noteFiles ?? []), [noteFiles])
  const headingAnchors = useMemo(() => new Map((noteFiles ?? []).map(({ path, text }) => [
    path,
    new Map(noteHeadings(text).map(({ line, anchor }) => [line, anchor])),
  ])), [noteFiles])
  const shownFiles = (noteFiles ?? []).filter(({ path }) => noteFolderOf(path) === entry.folderId)

  // Before paint, so a change of the folder shows the new place at once instead of the top first.
  // Only within the shown folder the move is animated.
  useLayoutEffect(() => {
    const container = scrollRef.current
    if (noteFiles === null || container === null || appliedMoves.current === moves) {
      return
    }
    const isSameFolder = shownFolderId.current === entry.folderId
    appliedMoves.current = moves
    shownFolderId.current = entry.folderId
    container.scrollTo({
      top: entry.scrollTop ?? targetTop(container, entry.target),
      behavior: isSameFolder && !prefersReducedMotion() ? 'smooth' : 'instant',
    })
  }, [noteFiles, moves, entry, scrollRef])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setIsVisible(scrollRef.current.scrollTop > 200)
    }
  }, [scrollRef])

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return (
    <StoryReaderContainer data-test-id="notes-view">
      <Background ref={scrollRef} onScroll={handleScroll} data-test-id="notes-scroll">
        {loadFailed && <LoadFailedText>Notizen konnten nicht geladen werden</LoadFailedText>}
        {!loadFailed && shownFiles.map(({ path, text }) => (
          <NotePage
            key={path}
            path={path}
            text={text}
            headingAnchors={headingAnchors.get(path) ?? NO_HEADINGS}
            index={index}
            onFollow={onFollow}
            isTranslucent={isTranslucent}
          />
        ))}
        <TopLink onClick={scrollToTop} $isVisible={isVisible}>
          <ReactSVG
            src={arrowUpIcon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </TopLink>
      </Background>
    </StoryReaderContainer>
  )
}

export default DocumentReader
