import { createGlobalStyle } from 'styled-components'

import { textStyle } from './tokens'

// Grundregeln nach DESIGN.md 1.1. Gilt für Admin, Wall und Ground, nicht für den Player:
// Jeder Screen bindet ihn selbst ein (läuft in einem eigenen Fenster).
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
