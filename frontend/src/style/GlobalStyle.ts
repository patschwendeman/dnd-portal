import { createGlobalStyle, css } from 'styled-components'

import { textStyle } from './tokens'

// Applies to all four screens: each screen renders it itself (it runs in its own window).
const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
  }

  body {
    font-family: ${(props) => props.theme.font.family.base};
    ${textStyle('md')}
  }
`

// Thin scrollbar whose thumb only shows while the mouse is over the scrolling area; apply it to the
// element that scrolls
export const hoverScrollbar = css`
  &::-webkit-scrollbar {
    width: ${(props) => props.theme.size.scrollbar};
  }
  &:hover::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
  }
`

const TILE_BLUR = '12px'

export interface TileSurfaceProps {
  // Only while an image lies behind the tile (background image in Admin and Player, scene on Wall
  // and Ground): over the plain background the translucent surface would give another tone than the
  // one the contrast was measured for
  $isTranslucent?: boolean
}

// Surface of the tiles in the Admin, the panels, overlays and tiles on Wall and Ground and the
// cards of the Player. The inner light edge at the top is the only box-shadow of the style guide;
// tiles cast no shadow. A tile with another surface sets its background-color after it and leaves
// out $isTranslucent
export const tileSurface = css<TileSurfaceProps>`
  background-color: ${(props) => (
    props.$isTranslucent ? props.theme.colors.secondaryTranslucent : props.theme.colors.secondary
  )};
  backdrop-filter: ${(props) => (props.$isTranslucent ? `blur(${TILE_BLUR})` : 'none')};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
  box-shadow: inset 0 ${(props) => props.theme.borderWidth.thin} 0
    ${(props) => props.theme.colors.border};
`

export default GlobalStyle
