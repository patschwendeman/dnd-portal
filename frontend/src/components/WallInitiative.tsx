import {
  ReactElement, useLayoutEffect, useRef, useState,
} from 'react'
import styled from 'styled-components'

import Label from './Label'
import WallCharacterTile, { WALL_TILE_SIZE } from './WallCharacterTile'
import { FightState, Player } from '../models/models'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { combatantAvatarText } from '../utils/fight'
import useInitiativeTransitions from '../utils/useInitiativeTransitions'
import {
  fitToWidth, initiativeQueue, InitiativeItem, InitiativeWidths, wallDetails, wallName,
} from '../utils/wallInitiative'

// Widths in px of the tiles in the strip, used to compute how many fit
const WIDTHS: InitiativeWidths = {
  active: WALL_TILE_SIZE.turn.width,
  combatant: WALL_TILE_SIZE.initiative.width,
  round: 72,
  more: 96,
  gap: 16,
}
// Divider and "+N weitere" are as high as the small tiles
const STRIP_TILE_HEIGHT = `${WALL_TILE_SIZE.initiative.height}px`

const Strip = styled.section`
  position: fixed;
  top: ${(props) => props.theme.space[6]};
  left: ${(props) => props.theme.space[7]};
  right: ${(props) => props.theme.space[7]};
  display: flex;
  align-items: flex-start;
  gap: ${WIDTHS.gap}px;
  z-index: ${(props) => props.theme.layer.tiles};
`

// Holds the fading copies of the tiles; React renders nothing into it
const GhostLayer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: ${(props) => props.theme.layer.tiles};
`

const CountTile = styled.div<TileSurfaceProps & { $width: number }>`
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[1]};
  width: ${(props) => props.$width}px;
  height: ${STRIP_TILE_HEIGHT};
  ${tileSurface}

  strong {
    ${textStyle('2xl')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
    font-variant-numeric: tabular-nums;
  }
`

const TurnHeader = styled.div`
  display: flex;
  align-self: stretch;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[2]};
`

// A filled badge: primary as text color would depend on the scene image behind the translucent
// tile and miss the contrast over a bright one
const OnTurn = styled(Label)`
  padding: 0 ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.onPrimary};
  border-radius: ${(props) => props.theme.radius.sm};
`

interface WallInitiativeProps {
  fight: FightState
  players: Player[]
}

function renderItem(item: InitiativeItem, fight: FightState, players: Player[]): ReactElement {
  if (item.type === 'round') {
    return (
      <CountTile
        key={item.key}
        data-key={item.key}
        data-test-id="wall-round"
        $width={WIDTHS.round}
        $isTranslucent
      >
        <Label>Runde</Label>
        <strong>{item.round}</strong>
      </CountTile>
    )
  }
  if (item.type === 'more') {
    return (
      <CountTile
        key={item.key}
        data-key={item.key}
        data-test-id="wall-more"
        $width={WIDTHS.more}
        $isTranslucent
      >
        <strong>{`+${item.count}`}</strong>
        <Label>weitere</Label>
      </CountTile>
    )
  }
  const { combatant, isActive } = item
  const player = players.find((p) => p.id === combatant.player_id)
  return (
    <WallCharacterTile
      key={item.key}
      dataKey={item.key}
      variant={isActive ? 'turn' : 'initiative'}
      kind={combatant.kind}
      avatarText={combatantAvatarText(combatant, players)}
      image={player?.avatar ?? null}
      name={wallName(combatant, player, isActive)}
      details={wallDetails(combatant, player)}
      isDead={combatant.kind === 'player' && combatant.defeated}
      header={isActive && (
        <TurnHeader>
          <OnTurn>Am Zug</OnTurn>
          <Label data-test-id="wall-turn-round">{`Runde ${fight.round}`}</Label>
        </TurnHeader>
      )}
      testId="wall-combatant"
    />
  )
}

// The initiative strip at the top of the Wall during a fight: the combatant on turn large at the
// left, the following ones in initiative order to the right of it
function WallInitiative({ fight, players }: WallInitiativeProps): ReactElement {
  const strip = useRef<HTMLElement>(null)
  const ghostLayer = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Measured before the first paint, so the strip does not show only "+N weitere" at first
  useLayoutEffect(() => {
    const element = strip.current
    if (!element) {
      return undefined
    }
    setWidth(element.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useInitiativeTransitions(strip, ghostLayer, fight.active_combatant_id)

  const items = fitToWidth(initiativeQueue(fight), width, WIDTHS)

  return (
    <>
      <Strip ref={strip} aria-label="Initiative" data-test-id="wall-initiative">
        {items.map((item) => renderItem(item, fight, players))}
      </Strip>
      <GhostLayer ref={ghostLayer} aria-hidden="true" />
    </>
  )
}

export default WallInitiative
