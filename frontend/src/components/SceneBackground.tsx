import { ReactElement } from 'react'
import styled from 'styled-components'

import { SCENE_FADE_MS } from '../utils/useSceneBackground'

// Lies before the grid of the Admin in the DOM, so the grid covers it without a z-index
const Root = styled.div`
  position: fixed;
  inset: 0;
  background-color: ${(props) => props.theme.colors.background};
`

// Image and scrim fade together, so without an image nothing darkens the plain background
const Layer = styled.div<{ $isShown: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${(props) => (props.$isShown ? 1 : 0)};
  transition: opacity ${SCENE_FADE_MS}ms ease-in-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: ${(props) => props.theme.colors.scrim};
  }
`

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

interface SceneBackgroundProps {
  // Image URLs from useSceneBackground; all but the shown one are invisible
  layers: string[]
  shown: string | null
  onLoad: (src: string) => void
  onError: (src: string) => void
}

// The wall image of the active scene behind the tiles of the Admin, darkened; pure decoration
function SceneBackground({
  layers, shown, onLoad, onError,
}: SceneBackgroundProps): ReactElement {
  return (
    <Root aria-hidden="true">
      {layers.map((src) => (
        <Layer key={src} $isShown={src === shown}>
          <Image src={src} alt="" onLoad={() => onLoad(src)} onError={() => onError(src)} />
        </Layer>
      ))}
    </Root>
  )
}

export default SceneBackground
