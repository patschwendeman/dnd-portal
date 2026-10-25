import { GroundGrid } from '../models/models'

// Range of the cell size the API accepts (PATCH /table), in px before the device pixel ratio
const GROUND_GRID_CELL_SIZE = { min: 100, max: 200, step: 10 } as const

const gridLineColor = (grid: GroundGrid): string | null => {
  switch (grid) {
    case 'black':
      return 'black'
    case 'white':
      return 'white'
    default:
      return null
  }
}

// Value of the slider (MUI passes an array for range sliders) as a cell size the API accepts:
// within the range, on the step
const toCellSize = (value: number | number[]): number => {
  const raw = Array.isArray(value) ? value[0] : value
  const { min, max, step } = GROUND_GRID_CELL_SIZE
  const stepped = min + Math.round((raw - min) / step) * step
  return Math.min(max, Math.max(min, stepped))
}

export { GROUND_GRID_CELL_SIZE, gridLineColor, toCellSize }
