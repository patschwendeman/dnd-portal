import { createContext } from 'react'

import { AudioState, SoundName, Theme } from '../models/models'
import { FullscreenScreen, ScreenCounts } from '../realtime/messages'
import { FullscreenHints, NO_FULLSCREEN_HINTS } from '../utils/screenStatus'

// The game table state comes from the server (WebSocket /ws); the contexts only pass it on, changes
// go through the API.

// null: no scene is active (Wall and Ground show only the background)
interface ActiveSceneContextType {
  activeSceneId: number | null
}

export const ActiveSceneContext = createContext<ActiveSceneContextType>({
  activeSceneId: null,
})

// null: no adventure is selected (yet), so no scenes or maps are loaded
interface ActiveAdventureContextType {
  activeAdventureId: number | null
}

export const ActiveAdventureContext = createContext<ActiveAdventureContextType>({
  activeAdventureId: null,
})

interface GameTableContextType {
  // false until the first snapshot of the server arrived
  hasState: boolean
  theme: Theme
  connected: boolean
  reconnectNow: () => void
  // Only for the Admin: connected Walls, Grounds and Players; null until the server sent them
  screens: ScreenCounts | null
  // Only for the Admin: whether the browser of a Wall or Ground refused the last full screen
  // request
  fullscreenHints: FullscreenHints
  // Only for the Admin: full screen of all Walls or all Grounds on or off
  requestScreenFullscreen: (screen: FullscreenScreen, active: boolean) => void
}

export const GameTableContext = createContext<GameTableContextType>({
  hasState: false,
  theme: 'dark',
  connected: true,
  reconnectNow: () => {},
  screens: null,
  fullscreenHints: NO_FULLSCREEN_HINTS,
  requestScreenFullscreen: () => {},
})

interface GameAudioContextType {
  // null until the first audio state of the server arrived
  audio: AudioState | null
  isAudioOutput: boolean
  requestAudioOutput: () => void
  reportTrackEnded: (trackId: number) => void
  subscribeSound: (listener: (name: SoundName) => void) => () => void
}

export const GameAudioContext = createContext<GameAudioContextType>({
  audio: null,
  isAudioOutput: false,
  requestAudioOutput: () => {},
  reportTrackEnded: () => {},
  subscribeSound: () => () => {},
})
