import { ReactElement, ReactNode, useMemo } from 'react'
import { ThemeProvider } from 'styled-components'

import { GameTableScreen, useGameTable } from './useGameTable'
import {
  ActiveAdventureContext, ActiveSceneContext, GameAudioContext, GameTableContext,
} from '../context/context'
import { Theme } from '../models/models'
import appTheme from '../style/appTheme'
import { effectiveTheme } from '../utils/playerTheme'

interface GameTableProviderProps {
  screen: GameTableScreen
  // Theme chosen on this device (Player); null or missing = theme of the game table
  themeOverride?: Theme | null
  children: ReactNode
}

// Connects the screen to the game table of the server and passes the state on: active adventure,
// active scene, theme and overlay of the Walls, the audio state and (Admin only) the number of
// connected screens. Until the first snapshot nothing is active, the theme is dark and there is no
// overlay; after a disconnect the last state stays. A theme override only changes the look of this
// screen; the contexts keep the theme of the game table.
function GameTableProvider({
  screen,
  themeOverride = null,
  children,
}: GameTableProviderProps): ReactElement {
  const {
    state,
    audio,
    isAudioOutput,
    screens,
    connected,
    reconnectNow,
    requestAudioOutput,
    reportTrackEnded,
    subscribeSound,
  } = useGameTable(screen)

  const activeAdventureId = state?.active_adventure_id ?? null
  const activeSceneId = state?.active_scene_id ?? null
  const theme = state?.theme ?? 'dark'
  const wallOverlay = state?.wall_overlay ?? 'off'

  const adventure = useMemo(() => ({ activeAdventureId }), [activeAdventureId])
  const scene = useMemo(() => ({ activeSceneId }), [activeSceneId])
  const gameTable = useMemo(
    () => ({
      hasState: state !== null,
      snapshot: state,
      theme,
      wallOverlay,
      connected,
      reconnectNow,
      screens,
    }),
    [state, theme, wallOverlay, connected, reconnectNow, screens],
  )
  const gameAudio = useMemo(
    () => ({
      audio, isAudioOutput, requestAudioOutput, reportTrackEnded, subscribeSound,
    }),
    [audio, isAudioOutput, requestAudioOutput, reportTrackEnded, subscribeSound],
  )
  const styledTheme = useMemo(
    () => appTheme(effectiveTheme(themeOverride, theme)),
    [themeOverride, theme],
  )

  return (
    <ThemeProvider theme={styledTheme}>
      <GameTableContext.Provider value={gameTable}>
        <ActiveAdventureContext.Provider value={adventure}>
          <ActiveSceneContext.Provider value={scene}>
            <GameAudioContext.Provider value={gameAudio}>
              {children}
            </GameAudioContext.Provider>
          </ActiveSceneContext.Provider>
        </ActiveAdventureContext.Provider>
      </GameTableContext.Provider>
    </ThemeProvider>
  )
}

export default GameTableProvider
