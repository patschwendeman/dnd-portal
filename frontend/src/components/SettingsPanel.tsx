import { ReactElement, ReactNode, useState } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

import Label from './Label'
import { PanelSlider, PanelSliderArea, SliderValue } from './PanelSlider'
import { SelectList, SelectOption } from './SelectList'
import { Theme } from '../models/models'
import { textStyle } from '../style/tokens'
import { ADVENTURE_LOCKED_TITLE } from '../utils/adventureSelect'
import { GROUND_GRID_CELL_SIZE, toCellSize } from '../utils/groundGrid'

import logoutIcon from '/assets/icons/logout.svg'
import lockIcon from '/assets/icons/padlock.svg'

const THEME_OPTIONS: readonly SelectOption<Theme>[] = [
  { value: 'cyber', label: 'Cyber' },
  { value: 'tavern', label: 'Taverne' },
]

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[5]};
  min-height: 100%;
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

// Pushed to the lower end of the panel, apart from the settings above it
const EndArea = styled.div`
  margin-top: auto;
`

// A field on the panel tile like the select lists (surface `background`). Two rows, because the
// panel is too narrow for label and name side by side
const EndButton = styled.button`
  display: grid;
  grid-template-areas: "label icon" "name icon";
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: ${(props) => props.theme.space[3]};
  width: 100%;
  min-height: ${(props) => props.theme.size.control.lg};
  padding: ${(props) => props.theme.space[2]} ${(props) => props.theme.space[3]};
  ${textStyle('sm')}
  font-family: inherit;
  font-weight: ${(props) => props.theme.fontWeight.medium};
  text-align: left;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.color};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:disabled {
    color: ${(props) => props.theme.colors.text.muted};
    cursor: default;
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

const EndLabel = styled.span`
  grid-area: label;
`

const EndName = styled.span`
  grid-area: name;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(props) => props.theme.colors.text.muted};
  font-weight: ${(props) => props.theme.fontWeight.regular};
`

const ButtonIcon = styled.span`
  grid-area: icon;

  svg {
    display: block;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

interface EndAdventureButtonProps {
  name: string
  isLocked: boolean
  isDisabled: boolean
  onEnd: () => void
}

function EndAdventureButton({
  name, isLocked, isDisabled, onEnd,
}: EndAdventureButtonProps): ReactElement {
  return (
    <EndButton
      type="button"
      data-test-id="end-adventure"
      // aria-disabled instead of disabled, so the tooltip shows and the button keeps its focus
      aria-disabled={isLocked || undefined}
      title={isLocked ? ADVENTURE_LOCKED_TITLE : undefined}
      disabled={isDisabled}
      onClick={() => {
        if (!isLocked) {
          onEnd()
        }
      }}
    >
      <EndLabel>Abenteuer beenden</EndLabel>
      <EndName data-test-id="end-adventure-name" title={name}>{name}</EndName>
      <ButtonIcon
        aria-hidden="true"
        data-test-id={isLocked ? 'end-adventure-lock' : undefined}
      >
        <ReactSVG src={isLocked ? lockIcon : logoutIcon} />
      </ButtonIcon>
    </EndButton>
  )
}

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
  /** The active adventure; null while it loads (the button "Abenteuer beenden" is not shown) */
  adventure: { name: string } | null
  onEndAdventure: () => void
  /** During a fight the adventure cannot end */
  isAdventureLocked: boolean
  /** While the error bar stands the adventure cannot end */
  isAdventureDisabled: boolean
  theme: Theme
  onThemeChange: (theme: Theme) => void
  groundGridCellSize: number
  failedSave: object | null
  onGroundGridCellSizeCommit: (cellSize: number) => void
}

function SettingsPanel({
  adventure,
  onEndAdventure,
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
      {adventure !== null && (
        <EndArea>
          <EndAdventureButton
            name={adventure.name}
            isLocked={isAdventureLocked}
            isDisabled={isAdventureDisabled}
            onEnd={onEndAdventure}
          />
        </EndArea>
      )}
    </Sections>
  )
}

export default SettingsPanel
