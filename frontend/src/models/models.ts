import type { components } from '../api/schema'

// Derived from the generated src/api/schema.d.ts (npm run generate:api); change the backend
// schemas, not these types
type Schemas = components['schemas']

export type AdventureSummary = Schemas['AdventureSummary']
export type AdventureDetail = Schemas['AdventureDetail']
export type SceneDetail = Schemas['SceneDetail']
export type Player = Schemas['Player']
export type Image = Schemas['Image']
export type Track = Schemas['Track']

// State of the game table, pushed by the server over the WebSocket /ws (and returned by GET/PATCH
// /table)
export type GameTableState = Schemas['GameTableState']
export type Theme = GameTableState['theme']
// What the Walls show above the scene image: the world map or nothing
export type WallOverlay = GameTableState['wall_overlay']
// Line colour of the grid on the Grounds, or no grid
export type GroundGrid = GameTableState['ground_grid']

// How players join the game table (GET /table/join): URL of the Player Screen in the LAN, null if
// unknown
export type JoinInfo = Schemas['JoinInfo']

export type AudioState = Schemas['AudioState']
export type AudioUpdate = Schemas['AudioUpdate']
export type SoundName = Schemas['SoundRequest']['name']

// The running fight of the active adventure (GET /table/fight, pushed only to Admins); combatants
// in initiative order
export type FightState = Schemas['FightState']
export type Combatant = Schemas['Combatant']
export type CombatantKind = Combatant['kind']
export type CombatantCreate = Schemas['CombatantCreate']
