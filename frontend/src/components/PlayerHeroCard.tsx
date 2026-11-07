import { ReactElement, ReactNode } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { css, useTheme } from 'styled-components'

import nextIcon from '/assets/icons/next.svg'

import CombatantAvatar from './CombatantAvatar'
import HeroCard from './HeroCard'
import Label from './Label'
import { TextButton } from './TextButton'
import { Player } from '../models/models'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { characterInitials } from '../utils/player'

// The frame "Am Zug" changes only the color of the edge, never the surface. Raised: the blur
// makes the card a stacking context of its own, the open settings list would otherwise lie below
// the resources that follow
const Card = styled.section<TileSurfaceProps & { $isOnTurn: boolean }>`
  z-index: ${(props) => props.theme.layer.raised};
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr);
  gap: ${(props) => props.theme.space[5]};
  min-height: 0;
  padding: ${(props) => props.theme.space[3]} ${(props) => props.theme.space[3]}
    ${(props) => props.theme.space[3]} ${(props) => props.theme.space[4]};
  ${tileSurface}
  ${(props) => props.$isOnTurn && css`
    border-color: ${props.theme.colors.primary};
    box-shadow: inset 0 0 0 ${props.theme.borderWidth.thin} ${props.theme.colors.primary};
  `}
`

// Settings at the top, "Zug beenden" at the bottom: the text of the card never runs below them
const Side = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[2]};
  min-height: 0;
`

const MenuSlot = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Turn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${(props) => props.theme.space[1]};
`

const OnTurnBadge = styled(Label)`
  padding: 0 ${(props) => props.theme.space[2]};
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.onPrimary};
  border-radius: ${(props) => props.theme.radius.pill};
  white-space: nowrap;
`

const EndTurnButton = styled(TextButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[2]};
  height: ${(props) => props.theme.size.control.lg};
  white-space: nowrap;

  &:disabled {
    cursor: progress;
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.text.color};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }

  div {
    display: grid;
    place-items: center;
  }
  svg {
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

const EndTurnError = styled.p`
  ${textStyle('xs')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  color: ${(props) => props.theme.colors.negative.text};
  white-space: nowrap;
`

interface PlayerHeroCardProps {
  /** null while the players load */
  player: Player | null
  level: number | null
  isOnTurn: boolean
  isEnding: boolean
  endFailed: boolean
  onEndTurn: () => void
  menu: ReactNode
  isTranslucent?: boolean
}

/** The own character on the Player Screen; on turn with frame, badge and "Zug beenden" */
function PlayerHeroCard({
  player, level, isOnTurn, isEnding, endFailed, onEndTurn, menu, isTranslucent = false,
}: PlayerHeroCardProps): ReactElement {
  const theme = useTheme()

  return (
    <Card
      aria-label="Charakter"
      data-test-id="player-hero"
      data-on-turn={isOnTurn}
      $isOnTurn={isOnTurn}
      $isTranslucent={isTranslucent}
    >
      {player ? (
        <HeroCard
          avatar={(
            <CombatantAvatar
              kind="player"
              text={characterInitials(player.character_name)}
              image={player.avatar}
              size="fill"
              onTile
            />
          )}
          caption={player.player_name}
          name={player.character_name}
          chips={[player.race, player.character_class]}
          level={level}
          badge={isOnTurn ? <OnTurnBadge data-test-id="on-turn">Am Zug</OnTurnBadge> : null}
          fill
        />
      ) : <div />}
      <Side>
        <MenuSlot>{menu}</MenuSlot>
        {isOnTurn && (
          <Turn>
            <EndTurnButton
              type="button"
              $variant="active"
              data-test-id="player-end-turn"
              disabled={isEnding}
              aria-busy={isEnding}
              onClick={onEndTurn}
            >
              <ReactSVG
                src={nextIcon}
                beforeInjection={(svg) => {
                  svg.setAttribute('style', `fill: ${theme.colors.onPrimary}`)
                }}
              />
              Zug beenden
            </EndTurnButton>
            {endFailed && (
              <EndTurnError role="alert" data-test-id="player-end-turn-error">
                Zug konnte nicht beendet werden
              </EndTurnError>
            )}
          </Turn>
        )}
      </Side>
    </Card>
  )
}

export default PlayerHeroCard
