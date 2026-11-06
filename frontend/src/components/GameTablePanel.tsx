import { ReactElement, ReactNode, useContext } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import OptionButtons from './OptionButtons'
import PanelButton from './PanelButton'
import { GameTableContext } from '../context/context'
import { GroundGrid, WallOverlay } from '../models/models'
import { textStyle } from '../style/tokens'
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

const ToggleButton = styled(PanelButton)`
  &[aria-pressed="true"] {
    background-color: ${(props) => props.theme.colors.primary};
  }
`

const Rows = styled.div`
  display: flex;
  flex-direction: column;
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
}

function ScreenRow({
  screen, name, path, control,
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
    </Row>
  )
}

interface GameTablePanelProps {
  wallOverlay: WallOverlay
  groundGrid: GroundGrid
  onWallOverlayChange: (wallOverlay: WallOverlay) => void
  onGroundGridChange: (groundGrid: GroundGrid) => void
}

function GameTablePanel({
  wallOverlay,
  groundGrid,
  onWallOverlayChange,
  onGroundGridChange,
}: GameTablePanelProps): ReactElement {
  const theme = useTheme()
  const { screens } = useContext(GameTableContext)
  const isJoinShown = wallOverlay === 'join'

  return (
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
      />
      <Row>
        <ScreenInfo>
          <ScreenName>Spieler</ScreenName>
          <PanelText data-test-id="screen-players">
            {playerStatusText(screens?.player ?? null)}
          </PanelText>
        </ScreenInfo>
        <PanelText>Spieler QR-Code</PanelText>
        <ToggleButton
          type="button"
          title="QR-Code"
          aria-label="QR-Code für Spieler auf der Wall"
          aria-pressed={isJoinShown}
          data-test-id="join-button"
          onClick={() => onWallOverlayChange(isJoinShown ? 'off' : 'join')}
        >
          <PanelIcon
            src={qrCodeIcon}
            fill={isJoinShown ? theme.colors.onPrimary : theme.colors.text.color}
          />
        </ToggleButton>
      </Row>
    </Rows>
  )
}

export default GameTablePanel
