import { FunctionComponent, ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

interface NavRailItem {
  id: string
  // Accessible name and tooltip of the icon button
  name: string
  icon: string
}

const Rail = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[1]};
  padding: ${(props) => props.theme.space[3]} 0;
  min-height: 0;
  background-color: ${(props) => props.theme.colors.background};
  border-right: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.secondary};
`

const RailButton = styled.button<{ $isActive: boolean }>`
  display: grid;
  place-items: center;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  background-color: ${(props) => (props.$isActive ? props.theme.colors.primary : props.theme.colors.secondary)};
  color: ${(props) => (props.$isActive ? props.theme.colors.onPrimary : props.theme.colors.text.color)};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }

  svg {
    display: block;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

interface NavRailProps {
  items: NavRailItem[]
  // Menu item whose panel is open, null while the panel is collapsed
  openItemId: string | null
  // id of the panel element the buttons control
  panelId: string
  onSelect: (id: string) => void
}

const NavRail: FunctionComponent<NavRailProps> = ({ items, openItemId, panelId, onSelect }): ReactElement => {
  const theme = useTheme()

  return (
    <Rail aria-label='Navigation' data-test-id='nav-rail'>
      {items.map((item) => {
        const isActive = item.id === openItemId
        return (
          <RailButton
            key={item.id}
            type='button'
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
                svg.setAttribute('style', `fill: ${isActive ? theme.colors.onPrimary : theme.colors.text.color}`)
              }}
            />
          </RailButton>
        )
      })}
    </Rail>
  )
}

export type { NavRailItem }
export { NavRail }
