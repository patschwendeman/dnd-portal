import {
  ReactElement, useCallback, useContext, useRef, useState,
} from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import JoinDialog from './JoinDialog'
import PanelButton from './PanelButton'
import { GameAudioContext, GameTableContext } from '../context/context'
import { textStyle } from '../style/tokens'
import { playerStatusText, screenStatusText } from '../utils/screenStatus'

import openWindowIcon from '/assets/icons/openWindow.svg'
import qrCodeIcon from '/assets/icons/qrCode.svg'

const STATUS_DOT_SIZE = '8px'

type TableScreen = 'wall' | 'ground'

const SCREENS: { screen: TableScreen, name: string, path: string }[] = [
  { screen: 'wall', name: 'Wall', path: '/wall' },
  { screen: 'ground', name: 'Ground', path: '/ground' },
]

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
`

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
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

const StatusText = styled.span`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
  ${textStyle('sm')}
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

const Players = styled.span`
  ${textStyle('sm')}
`

// One window per screen: a second click (also after a reload of the Admin) brings the open window
// to the front instead of opening another one or reloading it, so a Wall keeps its audio output
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

// Content of the dashboard panel "Screens": which screens are connected, open them, let players
// join
function ScreensPanel(): ReactElement {
  const theme = useTheme()
  const { screens } = useContext(GameTableContext)
  const { audio } = useContext(GameAudioContext)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const joinButtonRef = useRef<HTMLButtonElement>(null)

  const closeJoinDialog = useCallback(() => {
    setIsJoinDialogOpen(false)
    joinButtonRef.current?.focus()
  }, [])

  return (
    <Rows>
      {SCREENS.map(({ screen, name, path }) => {
        const count = screens === null ? null : screens[screen]
        return (
          <Row key={screen} data-test-id={`screen-${screen}`}>
            <ScreenInfo>
              <ScreenName>{name}</ScreenName>
              <StatusText data-test-id={`screen-${screen}-status`}>
                {count !== null && <StatusDot $isConnected={count > 0} />}
                {screenStatusText(count)}
              </StatusText>
              {screen === 'wall' && audio?.output_ready && (
                <StatusText data-test-id="screen-wall-audio">Audioausgabe</StatusText>
              )}
            </ScreenInfo>
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
      })}
      <Row>
        <Players data-test-id="screen-players">{playerStatusText(screens?.player ?? null)}</Players>
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
      {isJoinDialogOpen && <JoinDialog onClose={closeJoinDialog} />}
    </Rows>
  )
}

export default ScreensPanel
