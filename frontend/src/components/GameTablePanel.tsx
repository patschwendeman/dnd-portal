import {
  ReactElement, ReactNode, useCallback, useContext, useRef, useState,
} from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import JoinDialog from './JoinDialog'
import OptionButtons from './OptionButtons'
import PanelButton from './PanelButton'
import { PanelSlider, PanelSliderArea, SliderValue } from './PanelSlider'
import { GameTableContext } from '../context/context'
import { GroundGrid, WallOverlay } from '../models/models'
import { textStyle } from '../style/tokens'
import { GROUND_GRID_CELL_SIZE, toCellSize } from '../utils/groundGrid'
import { playerStatusText, screenStatusText } from '../utils/screenStatus'

import openWindowIcon from '/assets/icons/openWindow.svg'
import qrCodeIcon from '/assets/icons/qrCode.svg'

const STATUS_DOT_SIZE = '8px'
// Fits the screen names; a long status text wraps, so the controls keep their width in the
// narrow dashboard
const TABLE_NAME_COLUMN_WIDTH = '92px'

type TableScreen = 'wall' | 'ground'

const WALL_OVERLAY_OPTIONS: readonly { value: WallOverlay, label: string }[] = [
  { value: 'world', label: 'Weltkarte' },
  { value: 'off', label: 'Aus' },
]

const GROUND_GRID_OPTIONS: readonly { value: GroundGrid, label: string }[] = [
  { value: 'black', label: 'Schwarz' },
  { value: 'white', label: 'Weiß' },
  { value: 'off', label: 'Aus' },
]

const Row = styled.div`
  display: grid;
  grid-template-columns: ${TABLE_NAME_COLUMN_WIDTH} minmax(0, 1fr) auto;
  align-items: center;
  gap: ${(props) => props.theme.space[2]} ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[3]} 0;
  border-top: ${(props) => props.theme.borderWidth.thin} solid
    ${(props) => props.theme.colors.border};

  &:first-child {
    padding-top: 0;
    border-top: none;
  }

  &:last-child {
    padding-bottom: 0;
  }
`

const ScreenInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const ScreenName = styled.span`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

// Not in `text.muted`: on the panel surface it misses 4.5:1 in the Tavern theme
const PanelText = styled.span`
  ${textStyle('sm')}
`

const StatusText = styled(PanelText)`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
`

// Filled while connected, only a ring while not: the state does not depend on the color alone
const StatusDot = styled.span<{ $isConnected: boolean }>`
  flex-shrink: 0;
  width: ${STATUS_DOT_SIZE};
  height: ${STATUS_DOT_SIZE};
  background-color: ${(props) => (props.$isConnected ? props.theme.colors.primary : 'transparent')};
  border: ${(props) => props.theme.borderWidth.thick} solid
    ${(props) => (props.$isConnected ? props.theme.colors.primary : props.theme.colors.text.color)};
  border-radius: ${(props) => props.theme.radius.pill};
`

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`

const CellSize = styled.div`
  grid-column: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
`

// One window per screen: a second click (also after a reload of the Admin) brings the open window
// to the front instead of opening another one or reloading it
const openScreenWindow = (screen: TableScreen, path: string): void => {
  const opened = window.open('', `dnd-portal-${screen}`, 'popup')
  if (opened === null) {
    return
  }
  if (opened.location.href === 'about:blank') {
    opened.location.href = path
  }
  opened.focus()
}

interface PanelIconProps {
  src: string
  fill: string
}

function PanelIcon({ src, fill }: PanelIconProps): ReactElement {
  return (
    <ReactSVG
      src={src}
      beforeInjection={(svg) => {
        svg.setAttribute('style', `fill: ${fill}`)
        svg.setAttribute('aria-hidden', 'true')
      }}
    />
  )
}

interface ScreenRowProps {
  screen: TableScreen
  name: string
  path: string
  control: ReactNode
  children?: ReactNode
}

function ScreenRow({
  screen, name, path, control, children = undefined,
}: ScreenRowProps): ReactElement {
  const theme = useTheme()
  const { screens } = useContext(GameTableContext)
  const count = screens === null ? null : screens[screen]

  return (
    <Row data-test-id={`screen-${screen}`}>
      <ScreenInfo>
        <ScreenName>{name}</ScreenName>
        <StatusText data-test-id={`screen-${screen}-status`}>
          {count !== null && <StatusDot $isConnected={count > 0} />}
          {screenStatusText(count)}
        </StatusText>
      </ScreenInfo>
      {control}
      <PanelButton
        type="button"
        title="In neuem Fenster öffnen"
        aria-label={`${name} in neuem Fenster öffnen`}
        data-test-id={`screen-${screen}-open`}
        onClick={() => openScreenWindow(screen, path)}
      >
        <PanelIcon src={openWindowIcon} fill={theme.colors.text.color} />
      </PanelButton>
      {children}
    </Row>
  )
}

interface CellSizeControlProps {
  cellSize: number
  // The last failed write; a new one ends a drag of the slider like a new cell size
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
      <PanelText id="ground-grid-cell-size-label">Zellgröße</PanelText>
      <CellSize>
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
        <SliderValue data-test-id="ground-grid-cell-size-value">{shownCellSize}</SliderValue>
      </CellSize>
    </>
  )
}

interface GameTablePanelProps {
  wallOverlay: WallOverlay
  groundGrid: GroundGrid
  groundGridCellSize: number
  failedSave: object | null
  onWallOverlayChange: (wallOverlay: WallOverlay) => void
  onGroundGridChange: (groundGrid: GroundGrid) => void
  onGroundGridCellSizeCommit: (cellSize: number) => void
}

function GameTablePanel({
  wallOverlay,
  groundGrid,
  groundGridCellSize,
  failedSave,
  onWallOverlayChange,
  onGroundGridChange,
  onGroundGridCellSizeCommit,
}: GameTablePanelProps): ReactElement {
  const theme = useTheme()
  const { screens } = useContext(GameTableContext)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const joinButtonRef = useRef<HTMLButtonElement>(null)

  const closeJoinDialog = useCallback(() => {
    setIsJoinDialogOpen(false)
    joinButtonRef.current?.focus()
  }, [])

  return (
    <>
      <Rows>
        <ScreenRow
          screen="wall"
          name="Wall"
          path="/wall"
          control={(
            <OptionButtons
              options={WALL_OVERLAY_OPTIONS}
              value={wallOverlay}
              label="Wall-Anzeige"
              testIdPrefix="wall-overlay"
              onChange={onWallOverlayChange}
            />
          )}
        />
        <ScreenRow
          screen="ground"
          name="Ground"
          path="/ground"
          control={(
            <OptionButtons
              options={GROUND_GRID_OPTIONS}
              value={groundGrid}
              label="Ground-Anzeige"
              testIdPrefix="ground-grid"
              onChange={onGroundGridChange}
            />
          )}
        >
          <CellSizeControl
            cellSize={groundGridCellSize}
            failedSave={failedSave}
            onCommit={onGroundGridCellSizeCommit}
          />
        </ScreenRow>
        <Row>
          <ScreenInfo>
            <ScreenName>Spieler</ScreenName>
            <PanelText data-test-id="screen-players">
              {playerStatusText(screens?.player ?? null)}
            </PanelText>
          </ScreenInfo>
          <PanelText>Spieler QR-Code</PanelText>
          <PanelButton
            ref={joinButtonRef}
            type="button"
            title="QR-Code"
            aria-label="QR-Code für Spieler"
            aria-haspopup="dialog"
            data-test-id="join-button"
            onClick={() => setIsJoinDialogOpen(true)}
          >
            <PanelIcon src={qrCodeIcon} fill={theme.colors.text.color} />
          </PanelButton>
        </Row>
      </Rows>
      {isJoinDialogOpen && <JoinDialog onClose={closeJoinDialog} />}
    </>
  )
}

export default GameTablePanel
