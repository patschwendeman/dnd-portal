import { DefaultTheme } from 'styled-components'

import cyberTheme from './cyberTheme'
import tavernTheme from './tavernTheme'
import { tokens } from './tokens'
import { Theme } from '../models/models'

/** The tokens shared by both themes with the colors of `theme` */
const appTheme = (theme: Theme): DefaultTheme => ({
  ...tokens,
  colors: (theme === 'cyber' ? cyberTheme : tavernTheme).colors,
})

export default appTheme
