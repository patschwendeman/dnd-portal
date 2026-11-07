import { ReactElement } from 'react'
import styled, { css } from 'styled-components'

import { mediaUrl } from '../api/mediaUrl'
import { CombatantKind, Image } from '../models/models'
import { textStyle } from '../style/tokens'

const AVATAR_SIZE = { sm: '32px', md: '40px' }

// Portraits (3:4) on the Wall: party tile, tile of the initiative strip and the tile on turn
const WALL_AVATAR_SIZE = {
  party: { width: '84px', height: '112px' },
  initiative: { width: '72px', height: '96px' },
  turn: { width: '120px', height: '160px' },
}

type WallAvatarSize = keyof typeof WALL_AVATAR_SIZE

// fill: as large as the box around it (hero card of the Player Screen, grows with its height)
type AvatarSize = 'sm' | 'md' | 'hero' | 'fill' | WallAvatarSize

interface FrameProps {
  $kind: CombatantKind
  $size: AvatarSize
  $onTile: boolean
}

const frameSize = ({ $size }: FrameProps) => {
  if ($size === 'party' || $size === 'initiative') {
    return css`
      width: ${WALL_AVATAR_SIZE[$size].width};
      height: ${WALL_AVATAR_SIZE[$size].height};
      border-radius: ${(props) => props.theme.radius.md};
      ${textStyle('xl')}
    `
  }
  if ($size === 'turn') {
    return css`
      width: ${WALL_AVATAR_SIZE.turn.width};
      height: ${WALL_AVATAR_SIZE.turn.height};
      border-radius: ${(props) => props.theme.radius.lg};
      ${textStyle('2xl')}
    `
  }
  if ($size === 'hero' || $size === 'fill') {
    return css`
      width: ${(props) => ($size === 'fill' ? '100%' : props.theme.size.avatar.width)};
      height: ${(props) => ($size === 'fill' ? '100%' : props.theme.size.avatar.height)};
      border-radius: ${(props) => props.theme.radius.lg};
      ${textStyle('2xl')}
    `
  }
  return css`
    width: ${AVATAR_SIZE[$size]};
    height: ${AVATAR_SIZE[$size]};
    border-radius: ${(props) => props.theme.radius.md};
    ${textStyle('sm')}
  `
}

const NPC_ROLE = { enemy: 'negative', ally: 'positive' } as const

// A player avatar contrasts with what it sits on: background directly on the tile, secondary on
// rows that have the background as their surface. Enemies and allies show their number in the
// colors of their kind, the same in both themes
const frameColors = ({ $kind, $onTile }: FrameProps) => {
  if ($kind === 'player') {
    return css`
      background-color: ${(props) => (
        $onTile ? props.theme.colors.background : props.theme.colors.secondary
      )};
      color: ${(props) => props.theme.colors.initials};
      border-color: ${(props) => props.theme.colors.border};
    `
  }
  const role = NPC_ROLE[$kind]
  return css`
    background-color: ${(props) => props.theme.colors[role].surface};
    color: ${(props) => props.theme.colors[role].text};
    border-color: ${(props) => props.theme.colors[role].border};
  `
}

const Frame = styled.div<FrameProps>`
  display: grid;
  flex: none;
  place-items: center;
  overflow: hidden;
  border: ${(props) => props.theme.borderWidth.thin} solid;
  ${frameSize}
  ${frameColors}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  font-variant-numeric: tabular-nums;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

interface CombatantAvatarProps {
  kind: CombatantKind
  /** Initials of a player, number of an NPC; shown without an image */
  text: string
  image?: Image | null
  size?: AvatarSize
  /** Directly on the tile instead of on a row with its own surface */
  onTile?: boolean
  testId?: string
}

/**
 * Image of a combatant, or `text` without one; enemies and allies are framed in the colors of
 * their kind
 */
function CombatantAvatar({
  kind, text, image = null, size = 'md', onTile = false, testId = undefined,
}: CombatantAvatarProps): ReactElement {
  return (
    <Frame $kind={kind} $size={size} $onTile={onTile} data-test-id={testId} data-kind={kind}>
      {image
        ? <img src={mediaUrl(image.source)} alt="" />
        : <span aria-hidden="true">{text}</span>}
    </Frame>
  )
}

export default CombatantAvatar
