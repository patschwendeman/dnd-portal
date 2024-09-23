import { FunctionComponent, ReactElement, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import { SideBarLeftElement } from './SideBarLeftElement'

const markdownFilesMain = import.meta.glob('../../public/story/main/*.md')
const markdownFilesFight = import.meta.glob('../../public/story/fight/*.md')
const markdownFilesNoneFight = import.meta.glob('../../public/story/noneFight/*.md')

const SidebarLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 50px;
  width: 130px;
  height: 100%;
  background-color: #161b23;
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
  background-color: #0e1117;
  overflow-y: auto; /* Enable vertical scrolling */
`

const Page = styled.div`
  width: 60%;
  padding: 30px 100px;
  margin: 10px 0;
  border: 1px solid #3d444db3;

  h1 {
    padding-bottom: 0.3em;
    border-bottom: 1px solid #3d444db3;
    color: #f0f6fc;
  }
  
  h2 {
    color: #f0f6fc;
  }

  h3 {
    color: #f0f6fc;
  }
  
  p {
    color: #f0f6fc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    font-size: 16px;
    line-height: 1.5;
    word-wrap: break-word;
  }

  ul {
    color: #f0f6fc;
    padding-left: 2em;
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    padding-inline-start: 40px;
    line-height: 1.5;
  }

  li {
    color: #f0f6fc;
    line-height: 1.5;
  }

  a {
    color: #4493f8;
  }
`

const DocumentReader: FunctionComponent = (): ReactElement => {
  const [markdownContent, setMarkdownContent] = useState<string[]>([])
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0)

  const markdownLists = [markdownFilesMain, markdownFilesFight, markdownFilesNoneFight]

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
      </SidebarLeft>
      <StoryReaderContainer>
        <Background>
          {markdownContent.map((content, index) => (
            <Page key={index}>
              <ReactMarkdown>
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
