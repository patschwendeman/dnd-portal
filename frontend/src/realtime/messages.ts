import { isSoundName } from '../audio/sounds'
import {
  AudioState,
  Combatant,
  CombatantKind,
  FightState,
  GameTableState,
  GroundGrid,
  SoundName,
  Theme,
  Track,
  WallOverlay,
} from '../models/models'
import { GROUND_GRID_CELL_SIZE } from '../utils/groundGrid'

// Number of open connections per screen type, without the Admins
export interface ScreenCounts {
  wall: number
  ground: number
  player: number
}

// Messages on /ws (not part of the OpenAPI contract)
export type ServerMessage = { type: 'state', payload: GameTableState }
  | { type: 'audio', payload: AudioState }
  // Only to Admins: whether this connection is the audio output
  | { type: 'audio_output', payload: { active: boolean } }
  // Only to the audio output
  | { type: 'sound', payload: { name: SoundName } }
  // Only to Admins: sent after connecting and whenever a count changes
  | { type: 'screens', payload: ScreenCounts }
  // To Admins and (without labels) Walls and Players: sent after connecting and after every change;
  // null without a fight
  | { type: 'fight', payload: FightState | null }
  | { type: 'ping' }

// Sent only by the Admin; the server ignores messages of the other screens
export type ClientMessage = { type: 'audio_ready' }
  | { type: 'track_ended', payload: { track_id: number } }

const THEMES: readonly Theme[] = ['dark', 'tavern']
const WALL_OVERLAYS: readonly WallOverlay[] = ['world', 'join', 'off']
const GROUND_GRIDS: readonly GroundGrid[] = ['black', 'white', 'off']
const COMBATANT_KINDS: readonly CombatantKind[] = ['player', 'enemy', 'ally']

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isPositiveInteger = (value: unknown): value is number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
)

const isId = (value: unknown): value is number | null => value === null || isPositiveInteger(value)

const isCellSize = (value: unknown): value is number => {
  const { min, max, step } = GROUND_GRID_CELL_SIZE
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max
    && ((value as number) - min) % step === 0
}

const MIN_VOLUME = 0
const MAX_VOLUME = 100

const parseState = (payload: unknown): GameTableState | null => {
  if (!isRecord(payload)) {
    return null
  }
  // The payload follows the API contract, whose fields are snake_case
  const {
    active_adventure_id: activeAdventureId,
    active_scene_id: activeSceneId,
    theme,
    wall_overlay: wallOverlay,
    ground_grid: groundGrid,
    ground_grid_cell_size: groundGridCellSize,
  } = payload
  if (
    !isId(activeAdventureId)
    || !isId(activeSceneId)
    || !THEMES.includes(theme as Theme)
    || !WALL_OVERLAYS.includes(wallOverlay as WallOverlay)
    || !GROUND_GRIDS.includes(groundGrid as GroundGrid)
    || !isCellSize(groundGridCellSize)
  ) {
    return null
  }
  return {
    active_adventure_id: activeAdventureId,
    active_scene_id: activeSceneId,
    theme: theme as Theme,
    wall_overlay: wallOverlay as WallOverlay,
    ground_grid: groundGrid as GroundGrid,
    ground_grid_cell_size: groundGridCellSize,
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
  if (!isRecord(payload)) {
    return null
  }
  const { wall, ground, player } = payload
  if (!isCount(wall) || !isCount(ground) || !isCount(player)) {
    return null
  }
  return { wall, ground, player }
}

const parseCombatant = (value: unknown): Combatant | null => {
  if (!isRecord(value)) {
    return null
  }
  const {
    id, kind, player_id: playerId, number, label, defeated,
  } = value
  if (
    !isPositiveInteger(id)
    || !COMBATANT_KINDS.includes(kind as CombatantKind)
    || !isId(playerId)
    || !isId(number)
    || (label !== null && typeof label !== 'string')
    || typeof defeated !== 'boolean'
  ) {
    return null
  }
  return {
    id, kind: kind as CombatantKind, player_id: playerId, number, label, defeated,
  }
}

// undefined: invalid; null: no fight
const parseFight = (payload: unknown): FightState | null | undefined => {
  if (payload === null) {
    return null
  }
  if (!isRecord(payload) || !Array.isArray(payload.combatants)) {
    return undefined
  }
  const {
    round, active_combatant_id: activeCombatantId, scene_id: sceneId,
  } = payload
  const combatants = payload.combatants.map(parseCombatant)
  if (
    !isPositiveInteger(round)
    || !isId(activeCombatantId)
    || !isPositiveInteger(sceneId)
    || combatants.some((combatant) => combatant === null)
  ) {
    return undefined
  }
  return {
    round,
    active_combatant_id: activeCombatantId,
    scene_id: sceneId,
    combatants: combatants as Combatant[],
  }
}

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
  if (message.type === 'fight') {
    const payload = parseFight(message.payload)
    return payload === undefined ? null : { type: 'fight', payload }
  }
  return null
}
