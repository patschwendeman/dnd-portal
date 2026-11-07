import { ReactElement, ReactNode, useState } from 'react'
import styled from 'styled-components'

import AdventureSelect from './AdventureSelect'
import Label from './Label'
import { PanelSlider, PanelSliderArea, SliderValue } from './PanelSlider'
import { SelectList, SelectOption } from './SelectList'
import { AdventureSummary, Theme } from '../models/models'
import { textStyle } from '../style/tokens'
import { GROUND_GRID_CELL_SIZE, toCellSize } from '../utils/groundGrid'

const THEME_OPTIONS: readonly SelectOption<Theme>[] = [
  { value: 'dark', label: 'Dunkel' },
  { value: 'tavern', label: 'Taverne' },
]

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[5]};
`

const SectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[2]};
`

// Like the label of the panel "Szenen": in line with the text of the controls below
const SectionLabel = styled(Label)`
  padding: 0 ${(props) => props.theme.space[3]};
`

const CellSizeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[3]};
  padding: 0 ${(props) => props.theme.space[3]};
`

const PanelText = styled.span`
  ${textStyle('sm')}
`

interface SectionProps {
  label: string
  testId: string
  children: ReactNode
}

function Section({ label, testId, children }: SectionProps): ReactElement {
  return (
    <SectionBody data-test-id={testId}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </SectionBody>
  )
}

interface CellSizeControlProps {
  cellSize: number
  /** The last failed write; a new one ends a drag of the slider like a new cell size */
  failedSave: object | null
  onCommit: (cellSize: number) => void
}

function CellSizeControl({ cellSize, failedSave, onCommit }: CellSizeControlProps): ReactElement {
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
    <>
      <CellSizeHead>
        <PanelText id="ground-grid-cell-size-label">Zellgröße</PanelText>
        <SliderValue data-test-id="ground-grid-cell-size-value">{shownCellSize}</SliderValue>
      </CellSizeHead>
      <PanelSliderArea>
        <PanelSlider
          aria-labelledby="ground-grid-cell-size-label"
          data-test-id="ground-grid-cell-size"
          value={shownCellSize}
          onChange={(_event, value) => setDraggedCellSize(toCellSize(value))}
          onChangeCommitted={(_event, value) => onCommit(toCellSize(value))}
          min={GROUND_GRID_CELL_SIZE.min}
          max={GROUND_GRID_CELL_SIZE.max}
          step={GROUND_GRID_CELL_SIZE.step}
        />
      </PanelSliderArea>
    </>
  )
}

interface SettingsPanelProps {
  adventures: AdventureSummary[]
  activeAdventureId: number | null
  onSelectAdventure: (adventureId: number) => void
  /** During a fight the adventure cannot change */
  isAdventureLocked: boolean
  /** While the error bar stands no adventure can be switched */
  isAdventureDisabled: boolean
  theme: Theme
  onThemeChange: (theme: Theme) => void
  groundGridCellSize: number
  failedSave: object | null
  onGroundGridCellSizeCommit: (cellSize: number) => void
}

function SettingsPanel({
  adventures,
  activeAdventureId,
  onSelectAdventure,
  isAdventureLocked,
  isAdventureDisabled,
  theme,
  onThemeChange,
  groundGridCellSize,
  failedSave,
  onGroundGridCellSizeCommit,
}: SettingsPanelProps): ReactElement {
  return (
    <Sections data-test-id="settings-panel">
      <Section label="Abenteuer" testId="settings-adventure">
        <AdventureSelect
          adventures={adventures}
          activeAdventureId={activeAdventureId}
          onSelectAdventure={onSelectAdventure}
          isLocked={isAdventureLocked}
          isDisabled={isAdventureDisabled}
        />
      </Section>
      <Section label="Darstellung" testId="settings-theme">
        <SelectList
          options={THEME_OPTIONS}
          value={theme}
          onChange={onThemeChange}
          label="Darstellung"
          testId="theme-select"
          optionTestIdPrefix="theme-select-option"
        />
      </Section>
      <Section label="Ground-Raster" testId="settings-ground-grid">
        <CellSizeControl
          cellSize={groundGridCellSize}
          failedSave={failedSave}
          onCommit={onGroundGridCellSizeCommit}
        />
      </Section>
    </Sections>
  )
}

export default SettingsPanel
