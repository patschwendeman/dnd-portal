import React, { FunctionComponent, ReactElement, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { textStyle } from '../style/tokens'
import { loadLatest } from '../utils/loadSafely'

import arrowUpIcon from '/assets/icons/arrowUp.svg'

const markdownFilesMain = import.meta.glob('../../public/story/main/*.md')
const markdownFilesFight = import.meta.glob('../../public/story/fight/*.md')
const markdownFilesNoneFight = import.meta.glob('../../public/story/noneFight/*.md')
const markdownFilesLeveling = import.meta.glob('../../public/story/leveling/*.md')
const markdownFilesMechanics = import.meta.glob('../../public/story/mechanics/*.md')

const markdownLists = [markdownFilesMain, markdownFilesFight, markdownFilesNoneFight, markdownFilesLeveling, markdownFilesMechanics]

const PAGE_MAX_WIDTH = '880px'
const LINE_MAX_WIDTH = '68ch'

const StoryReaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  ::-webkit-scrollbar {
    width: ${(props) => props.theme.size.scrollbar};
  }
  &:hover {
    ::-webkit-scrollbar-thumb {
      background: ${(props) => props.theme.colors.border}; 
    }
  }
`

const TopLink = styled.button<{ $isVisible: boolean }>`
  display: grid;
  place-items: center;
  position: absolute;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  border-radius: ${(props) => props.theme.radius.md};
  background-color: ${(props) => (props.theme.colors.secondary)};
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
  scroll-behavior: smooth;
`

const Page = styled.div`
  width: 100%;
  max-width: ${PAGE_MAX_WIDTH};
  padding: ${(props) => props.theme.space[7]} ${(props) => props.theme.space[8]};
  margin: 0;
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
  h1 {
    ${textStyle('2xl')}
    font-weight: ${(props) => props.theme.fontWeight.bold};
    margin: 0 0 ${(props) => props.theme.space[5]};
    padding-bottom: ${(props) => props.theme.space[3]};
    border-bottom: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
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
    max-width: ${LINE_MAX_WIDTH};
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
  .markdown-image {
    width: 100%;
    height: auto;
}
`

const LoadFailedText = styled.p`
  ${textStyle('reading')}
  max-width: ${LINE_MAX_WIDTH};
`

const MarkdownImage: FunctionComponent<{ src?: string; alt?: string }> = ({ src, alt = '' }) => (
  <a href={src} target="_blank" rel="noopener noreferrer">
    <img className="markdown-image" src={src} alt={alt} />
  </a>
)

function flatten(text: string, child: React.ReactNode): string {
  if (typeof child === 'string') {
    return text + child
  }
  if (React.isValidElement(child) && child.props.children) {
    return React.Children.toArray(child.props.children).reduce(flatten, text)
  }
  return text
}


function HeadingRenderer(props: { level: number; children: React.ReactNode }): ReactElement {
  const children = React.Children.toArray(props.children)
  const text = children.reduce(flatten, '')
  const slug = text.toLowerCase().replace(/\W/g, '-')
  return React.createElement(`h${props.level}`, { id: slug }, props.children)
}

interface DocumentReaderProps {
  // Index of the note folder, chosen in DocumentNavigation
  selectedStoryIndex: number
}

const DocumentReader: FunctionComponent<DocumentReaderProps> = ({ selectedStoryIndex }): ReactElement => {
  const theme = useTheme()
  const [markdownContent, setMarkdownContent] = useState<string[]>([])
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stale = false

    const loadMarkdownFiles = async () => {
      const selectedMarkdownFiles = markdownLists[selectedStoryIndex]
      const paths = Object.keys(selectedMarkdownFiles)
      const markdownPromises = paths.map(async (path) => {
        const currentPath = path.replace('../../public', '')
        const response = await fetch(currentPath)
        if (!response.ok) {
          throw new Error(`Loading ${currentPath} failed: HTTP ${response.status}`)
        }
        return response.text()
      })
      return Promise.all(markdownPromises)
    }

    loadLatest(
      loadMarkdownFiles,
      (markdownTextList) => {
        setMarkdownContent(markdownTextList)
        setLoadFailed(false)
      },
      (error) => {
        console.error('Error loading markdown files:', error)
        setLoadFailed(true)
      },
      () => stale
    )

    return () => {
      stale = true
    }
  }, [selectedStoryIndex])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setIsVisible(scrollContainerRef.current.scrollTop > 200)
    }
  }

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
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
  }, [])

  return (
    <StoryReaderContainer data-test-id='notes-view'>
      <Background ref={scrollContainerRef} onScroll={handleScroll} data-test-id='notes-scroll'>
        {loadFailed && <LoadFailedText>Notizen konnten nicht geladen werden</LoadFailedText>}
        {!loadFailed && markdownContent.map((content, index) => (
          <Page key={index}>
            <ReactMarkdown
            components={{
                h1: (props) => <HeadingRenderer {...props} level={1} />,
                h2: (props) => <HeadingRenderer {...props} level={2} />,
                h3: (props) => <HeadingRenderer {...props} level={3} />,
                h4: (props) => <HeadingRenderer {...props} level={4} />,
                h5: (props) => <HeadingRenderer {...props} level={5} />,
                h6: (props) => <HeadingRenderer {...props} level={6} />,
                img: (props) => <MarkdownImage {...props} />,
              }}
            >
              {content || 'Loading...'}
            </ReactMarkdown>
          </Page>
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

export { DocumentReader }
