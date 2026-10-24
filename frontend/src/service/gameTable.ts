import { saveData } from '../api/saveData'
import { GameTableState, WallOverlay } from '../models/models'

// Written by the Admin and by the control bar of the Wall; the request body follows the API
// contract (GameTableUpdate)
const saveWallOverlay = async (wallOverlay: WallOverlay): Promise<GameTableState> => (
  saveData('wall overlay', 'table', { wall_overlay: wallOverlay })
)

export default saveWallOverlay
