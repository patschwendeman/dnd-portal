import { ReactElement } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import AdventureSelect from './AdventureSelect'
import { AdventureSummary } from '../models/models'
import useDocumentFullscreen from '../utils/useDocumentFullscreen'

import dashboardIcon from '/assets/icons/dashboard.svg'
import fullscreenIcon from '/assets/icons/fullscreen.svg'
import fullscreenExitIcon from '/assets/icons/fullscreenExit.svg'
import settingsIcon from '/assets/icons/settings.svg'

const OUTER_COLUMN_WIDTH = '240px'

const Bar = styled.div`
    display: grid;
    grid-template-columns: ${OUTER_COLUMN_WIDTH} 1fr ${OUTER_COLUMN_WIDTH};
    align-items: center;
    padding: 0 ${(props) => props.theme.space[5]};
    background-color: ${(props) => props.theme.colors.background};
    border-bottom: ${(props) => props.theme.borderWidth.thin} solid
      ${(props) => props.theme.colors.secondary};
`

const Actions = styled.div`
    display: flex;
    justify-self: end;
    gap: ${(props) => props.theme.space[1]};
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
          props.$isActive ? props.theme.colors.primary : props.theme.colors.secondary
        )};
    }

    &:focus-visible {
        outline: ${(props) => props.theme.borderWidth.thick} solid
          ${(props) => props.theme.colors.primary};
        outline-offset: ${(props) => props.theme.borderWidth.thick};
    }
`

interface TopBarProps {
  // Switches the theme of the game table (Admin, Wall and Ground)
  onToggleTheme: () => void
  adventures: AdventureSummary[]
  activeAdventureId: number | null
  onSelectAdventure: (adventureId: number) => void
  isDashboardOpen: boolean
  // id of the dashboard element the toggle button controls
  dashboardId: string
  onToggleDashboard: () => void
}

function TopBar({
  onToggleTheme,
  adventures,
  activeAdventureId,
  onSelectAdventure,
  isDashboardOpen,
  dashboardId,
  onToggleDashboard,
}: TopBarProps): ReactElement {
  const theme = useTheme()
  const { isFullscreen, toggle: toggleFullscreen } = useDocumentFullscreen()

  return (
    <Bar data-test-id="top-bar">
      <AdventureSelect
        adventures={adventures}
        activeAdventureId={activeAdventureId}
        onSelectAdventure={onSelectAdventure}
      />
      <div />
      <Actions>
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
        <IconButton onClick={onToggleTheme}>
          <ReactSVG
            src={settingsIcon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </IconButton>
      </Actions>
    </Bar>
  )
}

export default TopBar
