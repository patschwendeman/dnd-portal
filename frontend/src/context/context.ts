import { createContext } from 'react'

import {
  AudioState, GameTableState, SoundName, Theme, WallOverlay,
} from '../models/models'
import { ScreenCounts } from '../realtime/messages'

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
  // The last snapshot, a new object with every push (also an unchanged state after a write), so
  // the Admin can reload what the snapshot does not contain; null until the first one arrived
  snapshot: GameTableState | null
  theme: Theme
  // Overlay of the Walls; 'off' until the first snapshot arrived
  wallOverlay: WallOverlay
  connected: boolean
  reconnectNow: () => void
  // Only for the Admin: connected Walls, Grounds and Players; null until the server sent them
  screens: ScreenCounts | null
}

export const GameTableContext = createContext<GameTableContextType>({
  hasState: false,
  snapshot: null,
  theme: 'dark',
  wallOverlay: 'off',
  connected: true,
  reconnectNow: () => {},
  screens: null,
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
