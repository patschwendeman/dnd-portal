export interface Battlemap {
  xp: string
  loot: string
  enemies: string
  locked: boolean
  source: string
  id: number
  name: string
  source_clear: string
}

export interface Map {
  id: number
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
  battlemaps_id: number | null
  id: number
  description: string
  fight: boolean
  music_id: number
  battlemaps: Battlemap | null
  graphics_ground: Screen
  graphics_wall: Screen
  music: Music
}
