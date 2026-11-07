import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

import CombatantAvatar from './CombatantAvatar'
import Label from './Label'
import {
  ListRow, RowDetails, RowInfo, RowList, RowName,
} from './ListRow'
import { Combatant, Player } from '../models/models'
import { combatantAvatarText, combatantDetails, combatantName } from '../utils/fight'

import skullIcon from '/assets/icons/skull.svg'

// Out of the fight: still in the list, but faded
const DEFEATED_OPACITY = 0.5

const Row = styled(ListRow)<{ $isActive: boolean, $isDefeated: boolean }>`
  box-shadow: ${(props) => (props.$isActive
    ? `inset 0 0 0 ${props.theme.borderWidth.thick} ${props.theme.colors.primary}`
    : 'none')};
  opacity: ${(props) => (props.$isDefeated ? DEFEATED_OPACITY : 1)};
`

const OnTurn = styled(Label)`
  flex: none;
  color: ${(props) => props.theme.colors.primary};
`

const DefeatedToggle = styled.button`
  display: grid;
  flex: none;
  place-items: center;
  width: ${(props) => props.theme.size.control.md};
  height: ${(props) => props.theme.size.control.md};
  padding: 0;
  background-color: transparent;
  color: ${(props) => props.theme.colors.text.color};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.colors.secondary};
  }

  &[aria-pressed="true"] {
    background-color: ${(props) => props.theme.colors.negative.surface};
    color: ${(props) => props.theme.colors.negative.text};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
  }

  svg {
    display: block;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

interface InitiativePanelProps {
  combatants: Combatant[]
  activeCombatantId: number | null
  players: Player[]
  onToggleDefeated: (combatant: Combatant) => void
}

const toggleTitle = (combatant: Combatant): string => {
  if (combatant.defeated) {
    return 'Wieder im Kampf'
  }
  return combatant.kind === 'player' ? 'Als tot markieren' : 'Als besiegt markieren'
}

/**
 * Content of the dashboard panel "Initiative": all combatants in initiative order; the one on turn
 * is framed, defeated ones are faded and can be taken back
 */
function InitiativePanel({
  combatants, activeCombatantId, players, onToggleDefeated,
}: InitiativePanelProps): ReactElement {
  return (
    <RowList data-test-id="initiative-list">
      {combatants.map((combatant) => {
        const isActive = combatant.id === activeCombatantId
        const player = players.find((p) => p.id === combatant.player_id)
        const details = combatantDetails(combatant, players)
        return (
          <Row
            key={combatant.id}
            lang="de"
            aria-current={isActive ? 'step' : undefined}
            data-test-id={`initiative-${combatant.id}`}
            data-active={isActive}
            data-defeated={combatant.defeated}
            $isActive={isActive}
            $isDefeated={combatant.defeated}
          >
            <CombatantAvatar
              kind={combatant.kind}
              text={combatantAvatarText(combatant, players)}
              image={player?.avatar ?? null}
            />
            <RowInfo>
              <RowName data-test-id="combatant-name">{combatantName(combatant, players)}</RowName>
              {details && <RowDetails data-test-id="combatant-details">{details}</RowDetails>}
            </RowInfo>
            {isActive && <OnTurn>Am Zug</OnTurn>}
            <DefeatedToggle
              type="button"
              title={toggleTitle(combatant)}
              aria-label={combatant.kind === 'player' ? 'Tot' : 'Besiegt'}
              aria-pressed={combatant.defeated}
              data-test-id="defeated-toggle"
              onClick={() => onToggleDefeated(combatant)}
            >
              <ReactSVG src={skullIcon} />
            </DefeatedToggle>
          </Row>
        )
      })}
    </RowList>
  )
}

export default InitiativePanel
