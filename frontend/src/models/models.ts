export interface Battlemap {
  xp: string;
  loot: string;
  enemies: string;
  locked: boolean;
  source_locked: string;
  id: number;
  name: string;
  source_clear: string;
}

export interface BattlemapLight {
  id: number;
  source: string;
}
