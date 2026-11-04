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

// Players keep the look of the party; enemies and allies show their number in the colors of
// their kind, the same in both themes
const frameColors = ({ $kind }: FrameProps) => {
  if ($kind === 'player') {
    return css`
      background-color: ${(props) => props.theme.colors.secondary};
      color: ${(props) => props.theme.colors.initials};
      border-color: ${(props) => props.theme.colors.border};
    `
  }
  return css`
    background-color: ${(props) => props.theme.colors.combatant[$kind].surface};
    color: ${(props) => props.theme.colors.combatant[$kind].text};
    border-color: ${(props) => props.theme.colors.combatant[$kind].border};
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
  testId?: string
}

function CombatantAvatar({
  kind, text, image = null, size = 'md', testId = undefined,
}: CombatantAvatarProps): ReactElement {
  return (
    <Frame $kind={kind} $size={size} data-test-id={testId} data-kind={kind}>
      {image
        ? <img src={mediaUrl(image.source)} alt="" />
        : <span aria-hidden="true">{text}</span>}
    </Frame>
  )
}

export default CombatantAvatar
