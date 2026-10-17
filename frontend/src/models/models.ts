import { components } from '../api/schema'

// Derived from the generated src/api/schema.d.ts (npm run generate:api); change the backend schemas, not these types
type Schemas = components['schemas']

export type AdventureSummary = Schemas['AdventureSummary']
export type AdventureDetail = Schemas['AdventureDetail']
export type SceneDetail = Schemas['SceneDetail']
export type Image = Schemas['Image']
export type Track = Schemas['Track']

// Response of /adventures/{id}/maps/main and /adventures/{id}/maps/side: the backend sends the scene id as id
export type MapResponse = Schemas['MapEntry']

// A tile in the map overviews, selecting it selects the scene with this id
export interface Map {
  sceneId: number
  source?: string
}
