import 'styled-components'

import cyberTheme from './cyberTheme'
import { tokens } from './tokens'

type Tokens = typeof tokens
type Colors = typeof cyberTheme.colors

declare module 'styled-components' {
  export interface DefaultTheme extends Tokens {
    colors: Colors
  }
}
