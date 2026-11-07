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
const Layer = styled.div<{ $isShown: boolean, $isInstant: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${(props) => (props.$isShown ? 1 : 0)};
  transition: ${(props) => (
    props.$isInstant ? 'none' : `opacity ${BACKGROUND_FADE_MS}ms ease-in-out`
  )};

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
  /** Appears without fading in */
  instant?: string | null
  onLoad: (src: string) => void
  onError: (src: string) => void
  /**
   * The shown image is the shared image of the page transition between the adventure selection
   * and the Admin; only one page may set it
   */
  isHero?: boolean
}

/**
 * The adventure image of the active adventure behind the tiles of the Admin and the cards of the
 * Player, darkened; pure decoration
 */
function AdventureBackground({
  layers, shown, instant = null, onLoad, onError, isHero = false,
}: AdventureBackgroundProps): ReactElement {
  return (
    <Root aria-hidden="true" data-test-id="adventure-background">
      {layers.map((src) => (
        <Layer
          key={src}
          data-view-hero={(isHero && src === shown) || undefined}
          $isShown={src === shown}
          $isInstant={src === instant}
        >
          <Image src={src} alt="" onLoad={() => onLoad(src)} onError={() => onError(src)} />
        </Layer>
      ))}
    </Root>
  )
}

export default AdventureBackground
