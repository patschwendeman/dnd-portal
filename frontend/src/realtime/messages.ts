import { GameTableState, Theme } from '../models/models'

// Messages of the server on /ws, see docs/architecture.md (not part of the OpenAPI contract)
export type ServerMessage =
  | { type: 'state', payload: GameTableState }
  | { type: 'ping' }

const THEMES: readonly Theme[] = ['dark', 'tavern']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isId = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)

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
  return null
}
