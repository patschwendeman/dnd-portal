import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'

import Label from './Label'
import { textStyle } from '../style/tokens'

const Card = styled.article`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[5]};
  min-width: 0;
`

// The badge sticks out at the top left of the avatar
const AvatarWrap = styled.div`
  position: relative;
  flex: none;
`

// The ring in the color of the tile separates the badge from the avatar below it
const LevelBadge = styled.span`
  position: absolute;
  top: calc(-1 * ${(props) => props.theme.space[2]});
  left: calc(-1 * ${(props) => props.theme.space[2]});
  display: grid;
  place-items: center;
  width: ${(props) => props.theme.size.badge};
  height: ${(props) => props.theme.size.badge};
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.onPrimary};
  border: ${(props) => props.theme.borderWidth.thick} solid
    ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.radius.pill};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  font-variant-numeric: tabular-nums;
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  min-width: 0;
`

const Caption = styled(Label)`
  overflow-wrap: break-word;
`

// Long names wrap (German words hyphenated, lang="de") instead of widening the card
const Name = styled.strong`
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  overflow-wrap: break-word;
  hyphens: auto;
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.space[1]};
  padding-top: ${(props) => props.theme.space[1]};
`

const Chip = styled.span`
  padding: 0 ${(props) => props.theme.space[2]};
  ${textStyle('sm')}
  background-color: ${(props) => props.theme.colors.background};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.md};
`

interface HeroCardProps {
  // Portrait (CombatantAvatar in size hero)
  avatar: ReactNode
  // Above the name: the player name, or the kind of an NPC
  caption: string
  name: string
  // Race and class of a player, the label of an NPC
  chips: string[]
  // Level badge on the avatar, only for players
  level?: number | null
  testId?: string
}

// A large card for one character: avatar (with the level of a player), caption, name and chips;
// the dashboard shows it for the combatant on turn
function HeroCard({
  avatar, caption, name, chips, level = null, testId = undefined,
}: HeroCardProps): ReactElement {
  return (
    <Card aria-label={name} data-test-id={testId} lang="de">
      <AvatarWrap>
        {avatar}
        {level !== null && <LevelBadge data-test-id="hero-level">{level}</LevelBadge>}
      </AvatarWrap>
      <Info>
        <Caption data-test-id="hero-caption">{caption}</Caption>
        <Name data-test-id="hero-name">{name}</Name>
        {chips.length > 0 && (
          <Chips>
            {chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}
          </Chips>
        )}
      </Info>
    </Card>
  )
}

export default HeroCard
