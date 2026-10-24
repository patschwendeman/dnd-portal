import { isSoundName } from '../audio/sounds'
import {
  AudioState, GameTableState, SoundName, Theme, Track,
} from '../models/models'

// Screens the Admin can switch to full screen remotely
export type FullscreenScreen = 'wall' | 'ground'

const FULLSCREEN_SCREENS: readonly FullscreenScreen[] = ['wall', 'ground']

// Number of open connections per screen type, without the Admins, and how many Walls and Grounds
// are in full screen
export interface ScreenCounts {
  wall: number
  ground: number
  player: number
  fullscreen: Record<FullscreenScreen, number>
}

// Messages on /ws, see docs/architecture.md (not part of the OpenAPI contract)
export type ServerMessage = { type: 'state', payload: GameTableState }
  | { type: 'audio', payload: AudioState }
  // Only to Walls: whether this connection is the audio output
  | { type: 'audio_output', payload: { active: boolean } }
  // Only to the audio output
  | { type: 'sound', payload: { name: SoundName } }
  // Only to Admins: sent after connecting and whenever a count changes
  | { type: 'screens', payload: ScreenCounts }
  // Only to Walls and Grounds: request of an Admin to switch full screen on or off
  | { type: 'fullscreen', payload: { active: boolean } }
  // Only to Admins: a Wall or Ground could not switch to full screen (the browser refused)
  | { type: 'fullscreen_rejected', payload: { screen: FullscreenScreen } }
  | { type: 'ping' }

// The server evaluates each message only from the screens named here and ignores the rest; the
// first two only from Walls
export type ClientMessage = { type: 'audio_ready' }
  | { type: 'track_ended', payload: { track_id: number } }
  // Wall and Ground
  | { type: 'fullscreen_state', payload: { active: boolean } }
  | { type: 'fullscreen_rejected' }
  // Admin
  | { type: 'fullscreen', payload: { screen: FullscreenScreen, active: boolean } }

const THEMES: readonly Theme[] = ['dark', 'tavern']

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isPositiveInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
)

const isId = (value: unknown): value is number | null => value === null || isPositiveInteger(value)

const MIN_VOLUME = 0
const MAX_VOLUME = 100

const parseState = (payload: unknown): GameTableState | null => {
  if (!isRecord(payload)) {
    return null
  }
  // The payload follows the API contract, whose fields are snake_case
  const { active_adventure_id: activeAdventureId, active_scene_id: activeSceneId, theme } = payload
  if (!isId(activeAdventureId) || !isId(activeSceneId) || !THEMES.includes(theme as Theme)) {
    return null
  }
  return {
    active_adventure_id: activeAdventureId,
    active_scene_id: activeSceneId,
    theme: theme as Theme,
  }
}

const parseTrack = (value: unknown): Track | null | undefined => {
  if (value === null) {
    return null
  }
  if (!isRecord(value)) {
    return undefined
  }
  const { id, name, source } = value
  if (!isPositiveInteger(id) || typeof name !== 'string' || typeof source !== 'string') {
    return undefined
  }
  return { id, name, source }
}

const parseAudio = (payload: unknown): AudioState | null => {
  if (!isRecord(payload)) {
    return null
  }
  const { playing, volume, output_ready: outputReady } = payload
  const track = parseTrack(payload.track)
  if (
    typeof playing !== 'boolean'
    || typeof outputReady !== 'boolean'
    || track === undefined
    || typeof volume !== 'number'
    || !Number.isInteger(volume)
    || volume < MIN_VOLUME
    || volume > MAX_VOLUME
  ) {
    return null
  }
  return {
    playing, track, volume, output_ready: outputReady,
  }
}

const isCount = (value: unknown): value is number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
)

const parseScreens = (payload: unknown): ScreenCounts | null => {
  if (!isRecord(payload) || !isRecord(payload.fullscreen)) {
    return null
  }
  const {
    wall, ground, player, fullscreen,
  } = payload
  const { wall: wallFullscreen, ground: groundFullscreen } = fullscreen
  if (
    !isCount(wall)
    || !isCount(ground)
    || !isCount(player)
    || !isCount(wallFullscreen)
    || !isCount(groundFullscreen)
  ) {
    return null
  }
  return {
    wall, ground, player, fullscreen: { wall: wallFullscreen, ground: groundFullscreen },
  }
}

const isFullscreenScreen = (value: unknown): value is FullscreenScreen => (
  FULLSCREEN_SCREENS.includes(value as FullscreenScreen)
)

// Returns null for anything that is not a valid, known message, so a newer server can add message
// types
export const parseServerMessage = (data: unknown): ServerMessage | null => {
  if (typeof data !== 'string') {
    return null
  }
  let message: unknown
  try {
    message = JSON.parse(data)
  } catch {
    return null
  }
  if (!isRecord(message)) {
    return null
  }
  if (message.type === 'ping') {
    return { type: 'ping' }
  }
  if (message.type === 'state') {
    const payload = parseState(message.payload)
    return payload === null ? null : { type: 'state', payload }
  }
  if (message.type === 'audio') {
    const payload = parseAudio(message.payload)
    return payload === null ? null : { type: 'audio', payload }
  }
  if (message.type === 'audio_output') {
    const active = isRecord(message.payload) ? message.payload.active : undefined
    return typeof active === 'boolean' ? { type: 'audio_output', payload: { active } } : null
  }
  if (message.type === 'sound') {
    const name = isRecord(message.payload) ? message.payload.name : undefined
    return isSoundName(name) ? { type: 'sound', payload: { name } } : null
  }
  if (message.type === 'screens') {
    const payload = parseScreens(message.payload)
    return payload === null ? null : { type: 'screens', payload }
  }
  if (message.type === 'fullscreen') {
    const active = isRecord(message.payload) ? message.payload.active : undefined
    return typeof active === 'boolean' ? { type: 'fullscreen', payload: { active } } : null
  }
  if (message.type === 'fullscreen_rejected') {
    const screen = isRecord(message.payload) ? message.payload.screen : undefined
    return isFullscreenScreen(screen) ? { type: 'fullscreen_rejected', payload: { screen } } : null
  }
  return null
}
