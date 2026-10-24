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

export default GlobalStyle
