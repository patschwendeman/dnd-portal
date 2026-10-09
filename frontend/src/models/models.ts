// Response of /maps/main and /maps/side: the backend sends the scene id as id
export interface MapResponse {
  id: number
  source?: string
}

// A tile in the map overviews, selecting it selects the scene with this id
export interface Map {
  sceneId: number
  source?: string
}

export interface Music {
  name: string
  source: string
  id: number
}

export interface Screen {
  name: string
  source: string
  id: number
}

export interface SceneDetail {
  name: string
  graphics_wall_id: number
  graphics_ground_id: number
  id: number
  description: string
  main: boolean
  music_id: number
  graphics_ground: Screen
  graphics_wall: Screen
  music: Music[]
}
