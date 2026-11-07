import { ReactElement } from 'react'
import styled from 'styled-components'

import CombatantAvatar from './CombatantAvatar'
import HeroCard from './HeroCard'
import { TextButton } from './TextButton'
import { Combatant, Player } from '../models/models'
import { textStyle } from '../style/tokens'
import {
  combatantAvatarText, combatantName, kindName, nextOnTurn,
} from '../utils/fight'

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[4]};
`

const Foot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[3]};
  padding-top: ${(props) => props.theme.space[3]};
  border-top: ${(props) => props.theme.borderWidth.thin} solid
    ${(props) => props.theme.colors.border};
`

const Next = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
  min-width: 0;
`

const NextLabel = styled.span`
  flex: none;
  ${textStyle('sm')}
`

const NextName = styled.span`
  min-width: 0;
  overflow: hidden;
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  white-space: nowrap;
  text-overflow: ellipsis;
`

const EndTurnButton = styled(TextButton)`
  flex: none;
`

const Nobody = styled.p`
  ${textStyle('sm')}
`

interface TurnPanelProps {
  combatants: Combatant[]
  activeCombatantId: number | null
  round: number
  players: Player[]
  /** Level of the adventure, shown on the avatar of a player */
  level: number | null
  onEndTurn: (combatantId: number) => void
}

const heroChips = (combatant: Combatant, player: Player | undefined): string[] => {
  if (player) {
    return [player.race, player.character_class]
  }
  return combatant.label ? [combatant.label] : []
}

/**
 * Content of the dashboard panel "Am Zug": the combatant on turn, who follows, and "Zug beenden"
 */
function TurnPanel({
  combatants, activeCombatantId, round, players, level, onEndTurn,
}: TurnPanelProps): ReactElement {
  const active = combatants.find((combatant) => combatant.id === activeCombatantId)
  if (!active) {
    return (
      <Nobody data-test-id="turn-nobody">
        Niemand am Zug – alle Teilnehmer sind ausgeschieden.
      </Nobody>
    )
  }
  const player = players.find((p) => p.id === active.player_id)
  const next = nextOnTurn(combatants, active.id)
  const showNext = next !== null && next.combatant.id !== active.id

  return (
    <Content>
      <HeroCard
        avatar={(
          <CombatantAvatar
            kind={active.kind}
            text={combatantAvatarText(active, players)}
            image={player?.avatar ?? null}
            size="hero"
            onTile
          />
        )}
        caption={active.kind === 'player' ? (player?.player_name ?? '') : kindName(active.kind)}
        name={combatantName(active, players)}
        chips={heroChips(active, player)}
        level={active.kind === 'player' ? level : null}
        testId="turn-hero"
      />
      <Foot>
        <Next data-test-id="turn-next">
          {showNext && (
            <>
              <NextLabel>{next.newRound ? `Runde ${round + 1}:` : 'Als Nächstes:'}</NextLabel>
              <CombatantAvatar
                kind={next.combatant.kind}
                text={combatantAvatarText(next.combatant, players)}
                image={players.find((p) => p.id === next.combatant.player_id)?.avatar ?? null}
                size="sm"
                onTile
              />
              <NextName data-test-id="turn-next-name">
                {combatantName(next.combatant, players)}
              </NextName>
            </>
          )}
        </Next>
        <EndTurnButton
          type="button"
          $variant="active"
          data-test-id="end-turn"
          onClick={() => onEndTurn(active.id)}
        >
          Zug beenden
        </EndTurnButton>
      </Foot>
    </Content>
  )
}

export default TurnPanel
