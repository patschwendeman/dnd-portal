import { FunctionComponent, ReactElement, ReactNode, useMemo } from 'react'
import { ThemeProvider } from 'styled-components'

import { GameTableScreen, useGameTable } from './useGameTable'
import { ActiveAdventureContext, ActiveSceneContext, GameTableContext } from '../context/context'
import { appTheme } from '../style/appTheme'

interface GameTableProviderProps {
  screen: GameTableScreen
  children: ReactNode
}

// Connects the screen to the game table of the server and passes the state on: active adventure, active scene and
// theme. Until the first snapshot nothing is active and the theme is dark; after a disconnect the last state stays.
const GameTableProvider: FunctionComponent<GameTableProviderProps> = ({ screen, children }): ReactElement => {
  const { state, connected, reconnectNow } = useGameTable(screen)

  const activeAdventureId = state?.active_adventure_id ?? null
  const activeSceneId = state?.active_scene_id ?? null
  const theme = state?.theme ?? 'dark'

  const adventure = useMemo(() => ({ activeAdventureId }), [activeAdventureId])
  const scene = useMemo(() => ({ activeSceneId }), [activeSceneId])
  const gameTable = useMemo(
    () => ({ hasState: state !== null, theme, connected, reconnectNow }),
    [state, theme, connected, reconnectNow]
  )
  const styledTheme = useMemo(() => appTheme(theme), [theme])

  return (
    <ThemeProvider theme={styledTheme}>
      <GameTableContext.Provider value={gameTable}>
        <ActiveAdventureContext.Provider value={adventure}>
          <ActiveSceneContext.Provider value={scene}>
            {children}
          </ActiveSceneContext.Provider>
        </ActiveAdventureContext.Provider>
      </GameTableContext.Provider>
    </ThemeProvider>
  )
}

export { GameTableProvider }
