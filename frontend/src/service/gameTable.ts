import { saveData } from '../api/saveData'
import { GameTableState, GroundGrid, WallOverlay } from '../models/models'

const saveWallOverlay = async (wallOverlay: WallOverlay): Promise<GameTableState> => (
  saveData('wall overlay', 'table', { wall_overlay: wallOverlay })
)

const saveGroundGrid = async (groundGrid: GroundGrid): Promise<GameTableState> => (
  saveData('ground grid', 'table', { ground_grid: groundGrid })
)

const saveGroundGridCellSize = async (cellSize: number): Promise<GameTableState> => (
  saveData('ground grid cell size', 'table', { ground_grid_cell_size: cellSize })
)

export { saveGroundGrid, saveGroundGridCellSize, saveWallOverlay }
