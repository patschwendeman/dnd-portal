import { ReactElement } from 'react'
import styled from 'styled-components'

import DashboardPanel from './DashboardPanel'
import Label from './Label'
import { mediaUrl } from '../api/mediaUrl'
import { Image, SceneDetail } from '../models/models'
import {
  ENTRANCE_CONTENT_ATTRIBUTES, tileEntranceAttributes, tileSurface, TileSurfaceProps,
} from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { TileEntrance } from '../utils/adminEntrance'

const STAGE_LABEL = 'Aktive Szene'

// One column, two rows: the ground inset at the top, the caption at the bottom. The pseudo element
// spans both and keeps the stage at least 16:9; a long caption makes it higher instead of being
// cut off, and it never runs below the inset
const Stage = styled.section<TileSurfaceProps>`
  ${tileSurface}
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-width: 0;
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.background};

  &::before {
    content: "";
    grid-area: 1 / 1 / 3 / 2;
    aspect-ratio: 16 / 9;
  }

  /* The wall image covers the inner light edge of the tile, so it is repeated above the image */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inherit;
    pointer-events: none;
  }
`

// Positioned, so it does not size the grid; everything after it in the DOM lies above it
const StageImage = styled.img`
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ImageLabel = styled(Label)`
  position: relative;
  grid-area: 1 / 1;
  align-self: start;
  justify-self: start;
  margin: ${(props) => props.theme.space[3]};
  padding: 0 ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.scrim};
  color: ${(props) => props.theme.colors.onScrim};
  border-radius: ${(props) => props.theme.radius.sm};
`

// Without an image the area stays empty in `background`
const GroundInset = styled.figure`
  position: relative;
  grid-area: 1 / 1;
  justify-self: end;
  width: calc(100% / 3);
  margin: ${(props) => props.theme.space[3]};
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.background};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.scrim};
  border-radius: ${(props) => props.theme.radius.md};

  ${ImageLabel} {
    position: absolute;
    margin: ${(props) => props.theme.space[1]};
  }
`

// The text starts below the transparent part of the gradient, so it always lies on the full
// scrim and stays readable on any image
const Caption = styled.div`
  position: relative;
  grid-area: 2 / 1;
  align-self: end;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  padding: ${(props) => props.theme.space[7]} ${(props) => props.theme.space[5]}
    ${(props) => props.theme.space[5]};
  background: linear-gradient(
    transparent,
    ${(props) => props.theme.colors.scrim} ${(props) => props.theme.space[7]}
  );
  color: ${(props) => props.theme.colors.onScrim};
  overflow-wrap: break-word;
  hyphens: auto;
`

const SceneName = styled.strong`
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const SceneDescription = styled.p`
  ${textStyle('sm')}
`

const NoScene = styled.p`
  ${textStyle('sm')}
`

const imageAlt = (label: string, image: Image): string => `${label}: ${image.name}`

interface ActiveScenePanelProps {
  activeScene: SceneDetail | undefined
  testId: string
  /** Place and direction in the build-up of the Admin */
  entrance: TileEntrance
}

/**
 * The stage of the dashboard: what Wall and Ground show, without looking at them. Name and
 * description wrap (long German words hyphenated, lang="de")
 */
function ActiveScenePanel({
  activeScene, testId, entrance,
}: ActiveScenePanelProps): ReactElement {
  if (!activeScene) {
    return (
      <DashboardPanel label={STAGE_LABEL} testId={testId} entrance={entrance} hasLoadedContent>
        <NoScene data-test-id="no-active-scene">Keine Szene aktiv</NoScene>
      </DashboardPanel>
    )
  }
  const { wall_image: wallImage, ground_image: groundImage } = activeScene
  return (
    <Stage
      aria-label={STAGE_LABEL}
      data-test-id={testId}
      lang="de"
      {...tileEntranceAttributes(entrance)}
      {...ENTRANCE_CONTENT_ATTRIBUTES}
    >
      {wallImage && (
        <StageImage
          src={mediaUrl(wallImage.source)}
          alt={imageAlt('Wall', wallImage)}
          data-test-id="active-scene-wall"
        />
      )}
      <ImageLabel>Wall</ImageLabel>
      <GroundInset>
        {groundImage && (
          <StageImage
            src={mediaUrl(groundImage.source)}
            alt={imageAlt('Ground', groundImage)}
            data-test-id="active-scene-ground"
          />
        )}
        <ImageLabel as="figcaption">Ground</ImageLabel>
      </GroundInset>
      <Caption>
        <Label>{STAGE_LABEL}</Label>
        <SceneName data-test-id="active-scene-name">{activeScene.name}</SceneName>
        <SceneDescription>{activeScene.description}</SceneDescription>
      </Caption>
    </Stage>
  )
}

export default ActiveScenePanel
