import {
  useCallback, useEffect, useRef, useState,
} from 'react'

import { ConnectionStatus, createGameTableConnection, GameTableConnection } from './connection'
import { FullscreenScreen, ScreenCounts } from './messages'
import { bindRemoteFullscreen, isDocumentFullscreen } from './remoteFullscreen'
import { API_BASE_URL } from '../api/apiClient'
import wsUrl from '../api/wsUrl'
import { AudioState, GameTableState, SoundName } from '../models/models'
import { FullscreenHints, NO_FULLSCREEN_HINTS, updateFullscreenHints } from '../utils/screenStatus'

export type GameTableScreen = 'admin' | 'wall' | 'ground' | 'player'

export type SoundListener = (name: SoundName) => void

// Screens whose full screen the Admin switches remotely
const isFullscreenScreen = (screen: GameTableScreen): boolean => (
  screen === 'wall' || screen === 'ground'
)

export interface GameTable {
  // null until the first snapshot of the server arrived
  state: GameTableState | null
  // null until the first audio state of the server arrived
  audio: AudioState | null
  // Only for a Wall: whether this connection is the audio output (false while disconnected)
  isAudioOutput: boolean
  // Only for the Admin: connected screens per type; null until the first counts arrived
  screens: ScreenCounts | null
  // Only for the Admin: per screen whether the browser refused the last full screen request; reset
  // once the screen is in full screen, gone or requested again
  fullscreenHints: FullscreenHints
  // Only for the Admin: switches full screen of all Walls or all Grounds on or off
  requestScreenFullscreen: (screen: FullscreenScreen, active: boolean) => void
  // false once the connection broke or could not be established; the first attempt counts as
  // connected, so the Admin does not show the hint on every load
  connected: boolean
  reconnectNow: () => void
  // Wall: become the audio output, also again after every reconnect until another Wall takes over
  requestAudioOutput: () => void
  reportTrackEnded: (trackId: number) => void
  // Sound effects sent to this connection (only to the audio output); returns the unsubscribe
  // function
  subscribeSound: (listener: SoundListener) => () => void
}

export const useGameTable = (screen: GameTableScreen): GameTable => {
  const [state, setState] = useState<GameTableState | null>(null)
  const [audio, setAudio] = useState<AudioState | null>(null)
  const [isAudioOutput, setIsAudioOutput] = useState<boolean>(false)
  const [screens, setScreens] = useState<ScreenCounts | null>(null)
  const [fullscreenHints, setFullscreenHints] = useState<FullscreenHints>(NO_FULLSCREEN_HINTS)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const connection = useRef<GameTableConnection | null>(null)
  // Set by "AUDIO", cleared when another Wall takes over
  const wantsAudioOutput = useRef<boolean>(false)
  const soundListeners = useRef<Set<SoundListener>>(new Set())

  useEffect(() => {
    const url = `${wsUrl(API_BASE_URL, window.location)}?screen=${screen}`
    const fullscreen = isFullscreenScreen(screen)
      ? bindRemoteFullscreen({
        onRejected: () => connection.current?.send({ type: 'fullscreen_rejected' }),
        onChange: (active) => connection.current?.send({
          type: 'fullscreen_state', payload: { active },
        }),
      })
      : null
    const current = createGameTableConnection({
      url,
      onState: setState,
      onMessage: (message) => {
        if (message.type === 'audio') {
          setAudio(message.payload)
        } else if (message.type === 'audio_output') {
          wantsAudioOutput.current = message.payload.active
          setIsAudioOutput(message.payload.active)
        } else if (message.type === 'screens') {
          setScreens(message.payload)
          setFullscreenHints((hints) => updateFullscreenHints(hints, message.payload))
        } else if (message.type === 'fullscreen') {
          fullscreen?.handleRequest(message.payload.active)
        } else if (message.type === 'fullscreen_rejected') {
          setFullscreenHints((hints) => ({ ...hints, [message.payload.screen]: true }))
        } else {
          soundListeners.current.forEach((listener) => listener(message.payload.name))
        }
      },
      onStatus: (next) => {
        setStatus(next)
        if (next !== 'open') {
          // The server releases the output of a closed connection
          setIsAudioOutput(false)
          return
        }
        if (wantsAudioOutput.current) {
          // The page already had a user interaction, so playback is allowed without a new click
          connection.current?.send({ type: 'audio_ready' })
        }
        if (fullscreen !== null) {
          // After a reconnect the server knows nothing about this screen
          connection.current?.send({
            type: 'fullscreen_state', payload: { active: isDocumentFullscreen() },
          })
        }
      },
    })
    connection.current = current
    return () => {
      fullscreen?.unbind()
      current.close()
      connection.current = null
    }
  }, [screen])

  const reconnectNow = useCallback(() => {
    connection.current?.reconnectNow()
  }, [])

  const requestAudioOutput = useCallback(() => {
    wantsAudioOutput.current = true
    // Without an open connection the message is dropped; it is sent once the connection is open
    connection.current?.send({ type: 'audio_ready' })
  }, [])

  const reportTrackEnded = useCallback((trackId: number) => {
    connection.current?.send({ type: 'track_ended', payload: { track_id: trackId } })
  }, [])

  const requestScreenFullscreen = useCallback((target: FullscreenScreen, active: boolean) => {
    setFullscreenHints((hints) => ({ ...hints, [target]: false }))
    connection.current?.send({ type: 'fullscreen', payload: { screen: target, active } })
  }, [])

  const subscribeSound = useCallback((listener: SoundListener) => {
    soundListeners.current.add(listener)
    return () => {
      soundListeners.current.delete(listener)
    }
  }, [])

  return {
    state,
    audio,
    isAudioOutput,
    screens,
    fullscreenHints,
    requestScreenFullscreen,
    connected: status !== 'closed',
    reconnectNow,
    requestAudioOutput,
    reportTrackEnded,
    subscribeSound,
  }
}
