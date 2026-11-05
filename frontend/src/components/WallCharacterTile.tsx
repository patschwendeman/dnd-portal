import { ReactElement, ReactNode } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { css } from 'styled-components'

import CombatantAvatar from './CombatantAvatar'
import { CombatantKind, Image } from '../models/models'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'

import skullIcon from '/assets/icons/skull.svg'

// Tile sizes in px on the Wall; the initiative strip also computes from them how many tiles fit.
// The small tiles of the strip have a fixed height, so the strip stays aligned while names and
// details change
export const WALL_TILE_SIZE = {
  party: { width: 176 },
  initiative: { width: 168, height: 176 },
  turn: { width: 240 },
} as const
// Badge with the skull on the avatar of a dead player
const SKULL_BADGE_SIZE = '28px'
const SKULL_ICON_SIZE = '16px'
// A dead player stays in the strip, but faded
const DEAD_OPACITY = 0.45

type TileVariant = 'party' | 'initiative' | 'turn'

interface TileProps extends TileSurfaceProps {
  $variant: TileVariant
}

const variantStyle = ({ $variant }: TileProps) => {
  if ($variant === 'party') {
    return css`
      width: ${WALL_TILE_SIZE.party.width}px;
      padding: ${(props) => props.theme.space[4]} ${(props) => props.theme.space[3]};
      gap: ${(props) => props.theme.space[2]};
    `
  }
  if ($variant === 'initiative') {
    return css`
      width: ${WALL_TILE_SIZE.initiative.width}px;
      height: ${WALL_TILE_SIZE.initiative.height}px;
      padding: ${(props) => props.theme.space[3]};
      gap: ${(props) => props.theme.space[2]};
    `
  }
  return css`
    width: ${WALL_TILE_SIZE.turn.width}px;
    padding: ${(props) => props.theme.space[4]};
    gap: ${(props) => props.theme.space[3]};
  `
}

const Tile = styled.article<TileProps>`
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  text-align: center;
  ${tileSurface}
  ${variantStyle}
  ${(props) => props.$variant === 'turn' && css`
    box-shadow: inset 0 0 0 ${props.theme.borderWidth.thick} ${props.theme.colors.primary};
  `}
`

const Faded = styled.div<{ $isDead: boolean }>`
  opacity: ${(props) => (props.$isDead ? DEAD_OPACITY : 1)};
`

const AvatarWrap = styled(Faded)`
  position: relative;
  flex: none;
`

// The ring in the color of the tile separates the badge from the avatar below it
const SkullBadge = styled.span`
  position: absolute;
  right: calc(-1 * ${(props) => props.theme.space[2]});
  bottom: calc(-1 * ${(props) => props.theme.space[2]});
  display: grid;
  place-items: center;
  width: ${SKULL_BADGE_SIZE};
  height: ${SKULL_BADGE_SIZE};
  background-color: ${(props) => props.theme.colors.negative.surface};
  color: ${(props) => props.theme.colors.negative.text};
  border: ${(props) => props.theme.borderWidth.thick} solid
    ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.radius.pill};

  svg {
    display: block;
    width: ${SKULL_ICON_SIZE};
    height: ${SKULL_ICON_SIZE};
  }
`

const Text = styled(Faded)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const NAME_STEP = { party: 'lg', initiative: 'md', turn: 'xl' } as const
const DETAILS_STEP = { party: 'sm', initiative: 'sm', turn: 'md' } as const

const Name = styled.span<{ $variant: TileVariant }>`
  ${(props) => textStyle(NAME_STEP[props.$variant])}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

// An NPC has no details; the empty line keeps the height of the tile. Full text color: the tile
// lets the scene image shine through, text.muted would miss the contrast over a bright image
const Details = styled.span<{ $variant: TileVariant }>`
  ${(props) => textStyle(DETAILS_STEP[props.$variant])}
  min-height: ${(props) => props.theme.text[DETAILS_STEP[props.$variant]].lineHeight};
`

interface WallCharacterTileProps {
  variant: TileVariant
  kind: CombatantKind
  // Initials of a player, number of an NPC; shown without an image
  avatarText: string
  image?: Image | null
  name: string
  details: string
  isDead?: boolean
  // Above the avatar, only on the tile on turn
  header?: ReactNode
  testId?: string
  dataKey?: string
}

// A character on the Wall: a player of the party or a combatant of the initiative strip
function WallCharacterTile({
  variant, kind, avatarText, image = null, name, details, isDead = false, header = null,
  testId = undefined, dataKey = undefined,
}: WallCharacterTileProps): ReactElement {
  return (
    <Tile
      $variant={variant}
      $isTranslucent
      aria-label={name}
      aria-current={variant === 'turn' ? 'step' : undefined}
      data-test-id={testId}
      data-key={dataKey}
      data-dead={isDead}
      lang="de"
    >
      {header}
      <AvatarWrap $isDead={isDead}>
        <CombatantAvatar kind={kind} text={avatarText} image={image} size={variant} onTile />
        {isDead && (
          <SkullBadge aria-label="Tot" data-test-id="wall-skull">
            <ReactSVG wrapper="span" src={skullIcon} />
          </SkullBadge>
        )}
      </AvatarWrap>
      <Text $isDead={isDead}>
        <Name $variant={variant} data-test-id="wall-name">{name}</Name>
        <Details $variant={variant} data-test-id="wall-details">{details}</Details>
      </Text>
    </Tile>
  )
}

export default WallCharacterTile
