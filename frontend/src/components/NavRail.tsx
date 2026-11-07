import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { NavRailPlacement, splitByPlacement } from '../utils/navRail'

interface NavRailItem {
  id: string
  /** Accessible name and tooltip of the icon button */
  name: string
  icon: string
  /** Red dot: something runs there (the fight) while its panel is not shown */
  hasBadge?: boolean
  /** Default top; bottom: at the lower end of the rail */
  placement?: NavRailPlacement
}

const Rail = styled.nav<TileSurfaceProps>`
  ${tileSurface}
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
  padding: ${(props) => props.theme.space[5]} 0;
  min-height: 0;
`

const BottomGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
  margin-top: auto;
`

const RailButton = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: grid;
  place-items: center;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  /* Like the entries in the panel: only the active item has a surface */
  background-color: ${(props) => (props.$isActive ? props.theme.colors.primary : 'transparent')};
  color: ${(props) => (
    props.$isActive ? props.theme.colors.onPrimary : props.theme.colors.text.color
  )};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (
      props.$isActive ? props.theme.colors.primary : props.theme.colors.background
    )};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }

  svg {
    display: block;
    width: ${(props) => props.theme.size.iconLg};
    height: ${(props) => props.theme.size.iconLg};
  }
`

// Small enough to sit in the corner of the 24px icon
const BADGE_SIZE = '8px'
const BADGE_INSET = '5px'

// The ring in the color of the rail separates the dot from the icon below it
const Badge = styled.span`
  position: absolute;
  top: ${BADGE_INSET};
  right: ${BADGE_INSET};
  width: ${BADGE_SIZE};
  height: ${BADGE_SIZE};
  background-color: ${(props) => props.theme.colors.negative.border};
  border-radius: ${(props) => props.theme.radius.pill};
  box-shadow: 0 0 0 ${(props) => props.theme.borderWidth.thick}
    ${(props) => props.theme.colors.secondary};
`

interface NavRailProps {
  items: NavRailItem[]
  /** Menu item whose panel is open, null while the panel is collapsed */
  openItemId: string | null
  /** id of the panel element the buttons control */
  panelId: string
  onSelect: (id: string) => void
  /** While the background image of the adventure lies behind the tiles */
  isTranslucent?: boolean
}

/**
 * Icon buttons that open their panel; the parent keeps which one is open (`openItemId`). Items
 * with placement bottom sit at the lower end, a badge only shows while its panel is not open.
 */
function NavRail({
  items, openItemId, panelId, onSelect, isTranslucent = false,
}: NavRailProps): ReactElement {
  const theme = useTheme()
  const { top, bottom } = splitByPlacement(items)

  const renderItem = (item: NavRailItem): ReactElement => {
    const isActive = item.id === openItemId
    const showsBadge = (item.hasBadge ?? false) && !isActive
    return (
      <RailButton
        key={item.id}
        type="button"
        title={item.name}
        aria-label={item.name}
        aria-pressed={isActive}
        aria-controls={panelId}
        data-test-id={`nav-item-${item.id}`}
        $isActive={isActive}
        onClick={() => onSelect(item.id)}
      >
        <ReactSVG
          src={item.icon}
          beforeInjection={(svg) => {
            const fill = isActive ? theme.colors.onPrimary : theme.colors.text.color
            svg.setAttribute('style', `fill: ${fill}`)
          }}
        />
        {showsBadge && <Badge aria-hidden="true" data-test-id={`nav-badge-${item.id}`} />}
      </RailButton>
    )
  }

  return (
    <Rail aria-label="Navigation" data-test-id="nav-rail" $isTranslucent={isTranslucent}>
      {top.map(renderItem)}
      {bottom.length > 0 && <BottomGroup>{bottom.map(renderItem)}</BottomGroup>}
    </Rail>
  )
}

export type { NavRailItem }
export { NavRail }
