import { isSoundName } from '../audio/sounds'
import { AudioState, GameTableState, SoundName, Theme, Track } from '../models/models'

// Messages on /ws, see docs/architecture.md (not part of the OpenAPI contract)
export type ServerMessage =
  | { type: 'state', payload: GameTableState }
  | { type: 'audio', payload: AudioState }
  // Only to Walls: whether this connection is the audio output
  | { type: 'audio_output', payload: { active: boolean } }
  // Only to the audio output
  | { type: 'sound', payload: { name: SoundName } }
  | { type: 'ping' }

// Sent only by the Wall; the server ignores messages of the other screens
export type ClientMessage =
  | { type: 'audio_ready' }
  // eslint-disable-next-line camelcase
  | { type: 'track_ended', payload: { track_id: number } }

const THEMES: readonly Theme[] = ['dark', 'tavern']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0

const isId = (value: unknown): value is number | null => value === null || isPositiveInteger(value)

const MIN_VOLUME = 0
const MAX_VOLUME = 100

const parseState = (payload: unknown): GameTableState | null => {
  if (!isRecord(payload)) {
    return null
  }
  // The payload follows the API contract, whose fields are snake_case
  /* eslint-disable camelcase */
  const { active_adventure_id, active_scene_id, theme } = payload
  if (!isId(active_adventure_id) || !isId(active_scene_id) || !THEMES.includes(theme as Theme)) {
    return null
  }
  return { active_adventure_id, active_scene_id, theme: theme as Theme }
  /* eslint-enable camelcase */
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
  /* eslint-disable camelcase */
  const { playing, volume, output_ready } = payload
  const track = parseTrack(payload.track)
  if (
    typeof playing !== 'boolean'
    || typeof output_ready !== 'boolean'
    || track === undefined
    || typeof volume !== 'number'
    || !Number.isInteger(volume)
    || volume < MIN_VOLUME
    || volume > MAX_VOLUME
  ) {
    return null
  }
  return { playing, track, volume, output_ready }
  /* eslint-enable camelcase */
}

// Returns null for anything that is not a valid, known message, so a newer server can add message types
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
  return null
}
