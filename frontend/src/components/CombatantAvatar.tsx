import { ReactElement } from 'react'
import styled, { css } from 'styled-components'

import { mediaUrl } from '../api/mediaUrl'
import { CombatantKind, Image } from '../models/models'
import { textStyle } from '../style/tokens'

const AVATAR_SIZE = { sm: '32px', md: '40px' }

type AvatarSize = 'sm' | 'md' | 'hero'

interface FrameProps {
  $kind: CombatantKind
  $size: AvatarSize
  $onTile: boolean
}

const frameSize = ({ $size }: FrameProps) => {
  if ($size === 'hero') {
    return css`
      width: ${(props) => props.theme.size.avatar.width};
      height: ${(props) => props.theme.size.avatar.height};
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
  // Initials of a player, number of an NPC; shown without an image
  text: string
  image?: Image | null
  size?: AvatarSize
  // Directly on the tile instead of on a row with its own surface
  onTile?: boolean
  testId?: string
}

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
