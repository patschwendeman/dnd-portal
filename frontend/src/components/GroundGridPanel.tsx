import Box from '@mui/material/Box'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import Label from './Label'
import OptionButtons from './OptionButtons'
import { PANEL_SLIDER_THUMB_SIZE, PanelSlider } from './PanelSlider'
import { GroundGrid } from '../models/models'
import { textStyle } from '../style/tokens'
import { GROUND_GRID_CELL_SIZE, toCellSize } from '../utils/groundGrid'

// Room for three digits, so the slider does not shift while dragging
const CELL_SIZE_VALUE_MIN_WIDTH = '3ch'

const OPTIONS: readonly { value: GroundGrid, label: string }[] = [
  { value: 'black', label: 'Schwarz' },
  { value: 'white', label: 'Weiß' },
  { value: 'off', label: 'Aus' },
]

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
`

// The panel is narrow: caption and value above, the slider below over the full width
const CellSize = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
      "label value"
      "slider slider";
  align-items: center;
  column-gap: ${(props) => props.theme.space[3]};
`

const CellSizeLabel = styled(Label)`
  grid-area: label;
`

const CellSizeValue = styled.span`
  grid-area: value;
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  text-align: right;
  min-width: ${CELL_SIZE_VALUE_MIN_WIDTH};
`

interface GroundGridPanelProps {
  groundGrid: GroundGrid
  cellSize: number
  // The last failed write; a new one ends a drag of the slider like a new cell size
  failedSave: object | null
  onGridChange: (groundGrid: GroundGrid) => void
  onCellSizeCommit: (cellSize: number) => void
}

function GroundGridPanel({
  groundGrid, cellSize, failedSave, onGridChange, onCellSizeCommit,
}: GroundGridPanelProps): ReactElement {
  // Only while the slider is dragged; afterwards it shows the cell size pushed by the server
  const [draggedCellSize, setDraggedCellSize] = useState<number | null>(null)

  // A new cell size or a failed write ends the drag, so the slider shows the server's value
  const [prevCellSizeSource, setPrevCellSizeSource] = useState({ cellSize, failedSave })
  if (prevCellSizeSource.cellSize !== cellSize || prevCellSizeSource.failedSave !== failedSave) {
    setPrevCellSizeSource({ cellSize, failedSave })
    setDraggedCellSize(null)
  }

  const shownCellSize = draggedCellSize ?? cellSize

  return (
    <Rows>
      <OptionButtons
        options={OPTIONS}
        value={groundGrid}
        testIdPrefix="ground-grid"
        onChange={onGridChange}
      />
      <CellSize>
        <CellSizeLabel id="ground-grid-cell-size-label">Zellgröße</CellSizeLabel>
        {/* Half a thumb left and right, so the thumb stays inside the panel at 100 and 200; the
            invisible touch area around the thumb is cut off instead of overflowing the panel */}
        <Box sx={{
          gridArea: 'slider',
          margin: 0,
          paddingInline: `calc(${PANEL_SLIDER_THUMB_SIZE} / 2)`,
          overflow: 'hidden',
        }}
        >
          <PanelSlider
            aria-labelledby="ground-grid-cell-size-label"
            data-test-id="ground-grid-cell-size"
            value={shownCellSize}
            onChange={(_event, value) => setDraggedCellSize(toCellSize(value))}
            onChangeCommitted={(_event, value) => onCellSizeCommit(toCellSize(value))}
            min={GROUND_GRID_CELL_SIZE.min}
            max={GROUND_GRID_CELL_SIZE.max}
            step={GROUND_GRID_CELL_SIZE.step}
          />
        </Box>
        <CellSizeValue data-test-id="ground-grid-cell-size-value">{shownCellSize}</CellSizeValue>
      </CellSize>
    </Rows>
  )
}

export default GroundGridPanel
