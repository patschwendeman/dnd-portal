import { createGlobalStyle } from 'styled-components'

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

export { GlobalStyle }
