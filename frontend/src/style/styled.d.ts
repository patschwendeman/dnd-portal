import 'styled-components'

import { darkTheme } from './darkTheme'
import { tokens } from './tokens'

type Tokens = typeof tokens
type Colors = typeof darkTheme.colors

declare module 'styled-components' {
  export interface DefaultTheme extends Tokens {
    colors: Colors
  }
}
