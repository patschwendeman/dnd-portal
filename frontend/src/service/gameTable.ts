import { saveData } from '../api/saveData'
import { GameTableState, WallOverlay } from '../models/models'

const saveWallOverlay = async (wallOverlay: WallOverlay): Promise<GameTableState> => (
  saveData('wall overlay', 'table', { wall_overlay: wallOverlay })
)

export default saveWallOverlay
