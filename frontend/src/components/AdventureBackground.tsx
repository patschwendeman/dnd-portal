import { ReactElement } from 'react'
import styled from 'styled-components'

import { BACKGROUND_FADE_MS } from '../utils/useAdventureBackground'

// Lies before the content of the screen in the DOM, so the content covers it without a z-index
const Root = styled.div`
  position: fixed;
  inset: 0;
  background-color: ${(props) => props.theme.colors.background};
`

// Image and darkening fade together, so without an image nothing darkens the plain background
const Layer = styled.div<{ $isShown: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${(props) => (props.$isShown ? 1 : 0)};
  transition: opacity ${BACKGROUND_FADE_MS}ms ease-in-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: ${(props) => props.theme.colors.backdrop};
  }
`

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

interface AdventureBackgroundProps {
  /** Image URLs from useAdventureBackground; all but the shown one are invisible */
  layers: string[]
  shown: string | null
  onLoad: (src: string) => void
  onError: (src: string) => void
}

/**
 * The image of the active adventure for the theme behind the tiles of the Admin and the cards of
 * the Player, darkened; pure decoration
 */
function AdventureBackground({
  layers, shown, onLoad, onError,
}: AdventureBackgroundProps): ReactElement {
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

export default AdventureBackground
