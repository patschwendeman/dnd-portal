import React, { FunctionComponent, ReactElement, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import { SideBarLeftElement } from './SideBarLeftElement'

const markdownFilesMain = import.meta.glob('../../public/story/main/*.md')
const markdownFilesFight = import.meta.glob('../../public/story/fight/*.md')
const markdownFilesNoneFight = import.meta.glob('../../public/story/noneFight/*.md')
const markdownFilesLeveling = import.meta.glob('../../public/story/leveling/*.md')
const markdownFilesMechanics = import.meta.glob('../../public/story/mechanics/*.md')

const SidebarLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 50px;
  width: 130px;
  height: 100%;
  padding: 20px 15px 0 15px;
`

const StoryReaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 400px;
  width: 100%;
  height: 100%;
`

const Background = styled.div`
  display: flex;
  padding-bottom: 50px;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`

const Page = styled.div`
  width: 60%;
  padding: 30px 100px;
  margin: 10px 0;
  border: 1px solid ${(props) => props.theme.colors.border};
  h1 {
    padding-bottom: 0.3em;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
  }
  p {
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
  }
  ul {
    padding-left: 2em;
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    padding-inline-start: 40px;
    line-height: 1.5;
  }
  li {
    line-height: 1.5;
  } 
  .markdown-image {
  width: 100%;
  height: auto; /* Erhält das Seitenverhältnis */
}
`

const MarkdownImage: FunctionComponent<{ src: string; alt?: string }> = ({ src, alt = '' }) => (
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

const DocumentReader: FunctionComponent = (): ReactElement => {
  const [markdownContent, setMarkdownContent] = useState<string[]>([])
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0)

  const markdownLists = [markdownFilesMain, markdownFilesFight, markdownFilesNoneFight, markdownFilesLeveling, markdownFilesMechanics]

  useEffect(() => {
    const loadMarkdownFiles = async () => {
      try {
        const selectedMarkdownFiles = markdownLists[selectedStoryIndex]
        const paths = Object.keys(selectedMarkdownFiles)
        const markdownPromises = paths.map(async (path) => {
          const currentPath = path.replace('../../public', '')
          const response = await fetch(currentPath)
          return response.text()
        })
        const markdownTextList = await Promise.all(markdownPromises)
        setMarkdownContent(markdownTextList)
      } catch (error) {
          throw new Error(`Error loading markdown files: ${error}`)
      }
    }

    loadMarkdownFiles()
  }, [selectedStoryIndex])

  const handleStorySelect = (index: number) => {
    setSelectedStoryIndex(index)
  }

  return (
    <>
      <SidebarLeft>
        <SideBarLeftElement name='Main' selectedStoryIndex={ selectedStoryIndex } handleStorySelect={ handleStorySelect } index={0} />
        <SideBarLeftElement name='Fight' selectedStoryIndex={ selectedStoryIndex } handleStorySelect={ handleStorySelect } index={1} />
        <SideBarLeftElement name='Side' selectedStoryIndex={ selectedStoryIndex } handleStorySelect={ handleStorySelect } index={2} />
        <SideBarLeftElement name='Leveling' selectedStoryIndex={ selectedStoryIndex } handleStorySelect={ handleStorySelect } index={3} />
        <SideBarLeftElement name='Mechaniken' selectedStoryIndex={ selectedStoryIndex } handleStorySelect={ handleStorySelect } index={4} />
      </SidebarLeft>
      <StoryReaderContainer>
        <Background>
          {markdownContent.map((content, index) => (
            <Page key={index}>
              <ReactMarkdown
              components={{
                  h1: (props) => <HeadingRenderer level={1} {...props} />,
                  h2: (props) => <HeadingRenderer level={2} {...props} />,
                  h3: (props) => <HeadingRenderer level={3} {...props} />,
                  h4: (props) => <HeadingRenderer level={4} {...props} />,
                  h5: (props) => <HeadingRenderer level={5} {...props} />,
                  h6: (props) => <HeadingRenderer level={6} {...props} />,
                  img: (props) => <MarkdownImage {...props} />,
                }}
              >
                {content || 'Loading...'}
              </ReactMarkdown>
            </Page>
          ))}
        </Background>
      </StoryReaderContainer>
    </>
  )
}

export { DocumentReader }
