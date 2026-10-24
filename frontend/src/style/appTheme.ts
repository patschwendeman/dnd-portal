import { DefaultTheme } from 'styled-components'

import darkTheme from './darkTheme'
import tavernTheme from './tavernTheme'
import { tokens } from './tokens'
import { Theme } from '../models/models'

const appTheme = (theme: Theme): DefaultTheme => ({
  ...tokens,
  colors: (theme === 'dark' ? darkTheme : tavernTheme).colors,
})

export default appTheme
