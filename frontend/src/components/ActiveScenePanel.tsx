import { ReactElement } from 'react'
import styled from 'styled-components'

import Label from './Label'
import { mediaUrl } from '../api/mediaUrl'
import { Image, SceneDetail } from '../models/models'
import { textStyle } from '../style/tokens'

// Lines of the description that fit below the previews in the fixed height of the panel
const DESCRIPTION_MAX_LINES = 2

const Previews = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${(props) => props.theme.space[3]};
`

const Preview = styled.figure`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  min-width: 0;
`

// Without an image the area stays empty, so both previews keep their place
const PreviewArea = styled.div`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.md};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const SceneName = styled.strong`
  display: block;
  margin-top: ${(props) => props.theme.space[3]};
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SceneDescription = styled.p`
  ${textStyle('sm')}
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${DESCRIPTION_MAX_LINES};
  overflow: hidden;
`

const NoScene = styled.p`
  ${textStyle('sm')}
`

interface ScenePreviewProps {
  label: string
  image: Image | undefined
  testId: string
}

function ScenePreview({ label, image, testId }: ScenePreviewProps): ReactElement {
  return (
    <Preview>
      <Label as="figcaption">{label}</Label>
      <PreviewArea>
        {image && (
          <img src={mediaUrl(image.source)} alt={`${label}: ${image.name}`} data-test-id={testId} />
        )}
      </PreviewArea>
    </Preview>
  )
}

interface ActiveScenePanelProps {
  activeScene: SceneDetail | undefined
}

// Content of the dashboard panel "Aktive Szene": what Wall and Ground show, without looking at them
function ActiveScenePanel({ activeScene }: ActiveScenePanelProps): ReactElement {
  if (!activeScene) {
    return <NoScene data-test-id="no-active-scene">Keine Szene aktiv</NoScene>
  }
  return (
    <>
      <Previews>
        <ScenePreview label="Wall" image={activeScene.wall_image} testId="active-scene-wall" />
        <ScenePreview
          label="Ground"
          image={activeScene.ground_image}
          testId="active-scene-ground"
        />
      </Previews>
      <SceneName data-test-id="active-scene-name">{activeScene.name}</SceneName>
      <SceneDescription title={activeScene.description}>{activeScene.description}</SceneDescription>
    </>
  )
}

export default ActiveScenePanel
