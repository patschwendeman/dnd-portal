import {
  ReactElement, useCallback, useContext, useRef, useState,
} from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import JoinDialog from './JoinDialog'
import { GameAudioContext, GameTableContext } from '../context/context'
import { delegateFullscreen } from '../realtime/remoteFullscreen'
import { textStyle } from '../style/tokens'
import { fullscreenHintText, playerStatusText, screenStatusText } from '../utils/screenStatus'

import fullscreenIcon from '/assets/icons/fullscreen.svg'
import fullscreenExitIcon from '/assets/icons/fullscreenExit.svg'
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

// Text left, icon buttons right; the text wraps instead of being cut off
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

// Wraps in the narrow panel; long German words are hyphenated (lang="de" on the element)
const Hint = styled.span`
  ${textStyle('sm')}
  overflow-wrap: break-word;
  hyphens: auto;
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

const Buttons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.space[1]};
`

// Highlighted while the screen is in full screen
const PanelButton = styled.button<{ $isActive?: boolean }>`
  display: grid;
  place-items: center;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  background-color: ${(props) => (
    props.$isActive ? props.theme.colors.primary : props.theme.colors.background
  )};
  color: ${(props) => (
    props.$isActive ? props.theme.colors.onPrimary : props.theme.colors.text.color
  )};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }

  svg {
    display: block;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

const Players = styled.span`
  ${textStyle('sm')}
`

// Windows the Admin opened, so a full screen request can pass the activation of the click on to
// them; lost with a reload of the Admin
const openedWindows = new Map<TableScreen, Window>()

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
  openedWindows.set(screen, opened)
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

// Content of the dashboard panel "Screens": which screens are connected and in full screen, open
// them, switch their full screen, let players join
function ScreensPanel(): ReactElement {
  const theme = useTheme()
  const { screens, fullscreenHints, requestScreenFullscreen } = useContext(GameTableContext)
  const { audio } = useContext(GameAudioContext)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const joinButtonRef = useRef<HTMLButtonElement>(null)

  const closeJoinDialog = useCallback(() => {
    setIsJoinDialogOpen(false)
    joinButtonRef.current?.focus()
  }, [])

  const toggleFullscreen = (screen: TableScreen, active: boolean) => {
    const opened = openedWindows.get(screen)
    if (active && opened !== undefined && !opened.closed) {
      delegateFullscreen(opened)
    }
    requestScreenFullscreen(screen, active)
  }

  return (
    <Rows>
      {SCREENS.map(({ screen, name, path }) => {
        const count = screens === null ? null : screens[screen]
        const isFullscreen = (screens?.fullscreen[screen] ?? 0) > 0
        const fullscreenLabel = isFullscreen ? 'Vollbild beenden' : 'Vollbild'
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
              {fullscreenHints[screen] && !isFullscreen && (
                <Hint role="status" lang="de" data-test-id={`screen-${screen}-fullscreen-hint`}>
                  {fullscreenHintText(name)}
                </Hint>
              )}
            </ScreenInfo>
            <Buttons>
              <PanelButton
                type="button"
                title={fullscreenLabel}
                aria-label={`${name}: Vollbild`}
                aria-pressed={isFullscreen}
                data-test-id={`screen-${screen}-fullscreen`}
                $isActive={isFullscreen}
                onClick={() => toggleFullscreen(screen, !isFullscreen)}
              >
                <PanelIcon
                  src={isFullscreen ? fullscreenExitIcon : fullscreenIcon}
                  fill={isFullscreen ? theme.colors.onPrimary : theme.colors.text.color}
                />
              </PanelButton>
              <PanelButton
                type="button"
                title="In neuem Fenster öffnen"
                aria-label={`${name} in neuem Fenster öffnen`}
                data-test-id={`screen-${screen}-open`}
                onClick={() => openScreenWindow(screen, path)}
              >
                <PanelIcon src={openWindowIcon} fill={theme.colors.text.color} />
              </PanelButton>
            </Buttons>
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
