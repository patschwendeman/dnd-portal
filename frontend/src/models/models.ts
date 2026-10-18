import { components } from '../api/schema'

// Derived from the generated src/api/schema.d.ts (npm run generate:api); change the backend schemas, not these types
type Schemas = components['schemas']

export type AdventureSummary = Schemas['AdventureSummary']
export type AdventureDetail = Schemas['AdventureDetail']
export type SceneDetail = Schemas['SceneDetail']
export type Image = Schemas['Image']
export type Track = Schemas['Track']

// State of the game table, pushed by the server over the WebSocket /ws (and returned by GET/PATCH /table)
export type GameTableState = Schemas['GameTableState']
export type Theme = GameTableState['theme']

// Music of the game table, pushed over the WebSocket /ws (and returned by the /table/audio endpoints)
export type AudioState = Schemas['AudioState']
export type AudioUpdate = Schemas['AudioUpdate']
// Sound effects the Wall that is the audio output plays (POST /table/sounds)
export type SoundName = Schemas['SoundRequest']['name']

// Response of /adventures/{id}/maps/main and /adventures/{id}/maps/side: the backend sends the scene id as id
export type MapResponse = Schemas['MapEntry']

// A tile in the map overviews, selecting it selects the scene with this id
export interface Map {
  sceneId: number
  source?: string
}
