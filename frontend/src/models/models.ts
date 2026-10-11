import { components } from '../api/schema'

// API types are generated from ../backend/openapi.json (npm run generate:api), do not edit them here
type Schemas = components['schemas']

export type SceneDetail = Schemas['SceneDetail']
export type Image = Schemas['Image']
export type Track = Schemas['Track']

// Response of /maps/main and /maps/side: the backend sends the scene id as id
export type MapResponse = Schemas['MapEntry']

// A tile in the map overviews, selecting it selects the scene with this id
export interface Map {
  sceneId: number
  source?: string
}
