import { ReactElement } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import ErrorBar from './ErrorBar'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import useDocumentFullscreen from '../utils/useDocumentFullscreen'

import arrowLeftIcon from '/assets/icons/arrowLeft.svg'
import arrowRightIcon from '/assets/icons/arrowRight.svg'
import dashboardIcon from '/assets/icons/dashboard.svg'
import fullscreenIcon from '/assets/icons/fullscreen.svg'
import fullscreenExitIcon from '/assets/icons/fullscreenExit.svg'

// The adventure name (or the error bar) stretches to the height of the button groups, so all
// tiles of the header are equally high
const Header = styled.header`
    display: flex;
    gap: ${(props) => props.theme.space[4]};
    min-width: 0;
`

// Only shows the active adventure; it is switched in the panel "Einstellungen"
const AdventureName = styled.div<TileSurfaceProps>`
    ${tileSurface}
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: 0 ${(props) => props.theme.space[5]};
    ${textStyle('md')}
    font-weight: ${(props) => props.theme.fontWeight.bold};
`

const AdventureNameText = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

// space.1 around buttons in radius.md gives the outer radius radius.lg of the tile
const ButtonGroup = styled.div<TileSurfaceProps>`
    ${tileSurface}
    display: flex;
    flex: none;
    gap: ${(props) => props.theme.space[1]};
    padding: ${(props) => props.theme.space[1]};
`

const IconButton = styled.button`
    display: grid;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    padding: 0;
    background-color: transparent;
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    &:hover:not(:disabled) {
        background-color: ${(props) => props.theme.colors.background};
    }

    &:disabled {
        cursor: default;
    }

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

// Highlighted like the active menu item of the navigation rail while the dashboard is shown (or
// the window is in full screen)
const ToggleButton = styled(IconButton)<{ $isActive: boolean }>`
    background-color: ${(props) => (props.$isActive ? props.theme.colors.primary : 'transparent')};

    &:hover {
        background-color: ${(props) => (
          props.$isActive ? props.theme.colors.primary : props.theme.colors.background
        )};
    }
`

interface ErrorNotice {
  message: string
  onRetry: () => void
}

interface AdminHeaderProps {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  /** Name of the active adventure; null without one, '' while it is loading */
  adventureName: string | null
  /** Replaces the adventure name while it is set */
  errorNotice: ErrorNotice | null
  isDashboardOpen: boolean
  dashboardId: string
  onToggleDashboard: () => void
  /** While the background image of the adventure lies behind the tiles */
  isTranslucent?: boolean
}

function AdminHeader({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  adventureName,
  errorNotice,
  isDashboardOpen,
  dashboardId,
  onToggleDashboard,
  isTranslucent = false,
}: AdminHeaderProps): ReactElement {
  const theme = useTheme()
  const { isFullscreen, toggle: toggleFullscreen } = useDocumentFullscreen()

  const historyButtons = [
    {
      name: 'Zurück',
      icon: arrowLeftIcon,
      isEnabled: canGoBack,
      onClick: onBack,
      testId: 'history-back',
    },
    {
      name: 'Vor',
      icon: arrowRightIcon,
      isEnabled: canGoForward,
      onClick: onForward,
      testId: 'history-forward',
    },
  ]

  return (
    <Header data-test-id="admin-header">
      <ButtonGroup $isTranslucent={isTranslucent} data-test-id="history-buttons">
        {historyButtons.map(({
          name, icon, isEnabled, onClick, testId,
        }) => (
          <IconButton
            key={testId}
            type="button"
            title={name}
            aria-label={name}
            disabled={!isEnabled}
            data-test-id={testId}
            onClick={onClick}
          >
            <ReactSVG
              src={icon}
              beforeInjection={(svg) => {
                const fill = isEnabled ? theme.colors.text.color : theme.colors.text.muted
                svg.setAttribute('style', `fill: ${fill}`)
              }}
            />
          </IconButton>
        ))}
      </ButtonGroup>
      {errorNotice ? (
        <ErrorBar message={errorNotice.message} onRetry={errorNotice.onRetry} />
      ) : (
        <AdventureName data-test-id="adventure-name" $isTranslucent={isTranslucent}>
          <AdventureNameText title={adventureName ?? undefined}>
            {adventureName ?? 'Kein Abenteuer'}
          </AdventureNameText>
        </AdventureName>
      )}
      <ButtonGroup $isTranslucent={isTranslucent}>
        <ToggleButton
          type="button"
          title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
          aria-label="Vollbild"
          aria-pressed={isFullscreen}
          data-test-id="fullscreen-toggle"
          $isActive={isFullscreen}
          onClick={toggleFullscreen}
        >
          <ReactSVG
            src={isFullscreen ? fullscreenExitIcon : fullscreenIcon}
            beforeInjection={(svg) => {
              const fill = isFullscreen ? theme.colors.onPrimary : theme.colors.text.color
              svg.setAttribute('style', `fill: ${fill}`)
            }}
          />
        </ToggleButton>
        <ToggleButton
          type="button"
          title="Dashboard"
          aria-label="Dashboard"
          aria-expanded={isDashboardOpen}
          aria-controls={dashboardId}
          data-test-id="dashboard-toggle"
          $isActive={isDashboardOpen}
          onClick={onToggleDashboard}
        >
          <ReactSVG
            src={dashboardIcon}
            beforeInjection={(svg) => {
              const fill = isDashboardOpen ? theme.colors.onPrimary : theme.colors.text.color
              svg.setAttribute('style', `fill: ${fill}`)
            }}
          />
        </ToggleButton>
      </ButtonGroup>
    </Header>
  )
}

export default AdminHeader
