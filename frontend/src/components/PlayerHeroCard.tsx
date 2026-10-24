import { ReactElement } from 'react'
import styled from 'styled-components'

import Label from './Label'
import { mediaUrl } from '../api/mediaUrl'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'
import { characterInitials } from '../utils/player'

const Card = styled.article`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[5]};
  min-width: 0;
  padding: ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.lg};
`

// The badge sticks out at the top left of the avatar, into the padding of the card
const AvatarWrap = styled.div`
  position: relative;
  flex: none;
`

const Avatar = styled.div`
  display: grid;
  place-items: center;
  width: ${(props) => props.theme.size.avatar.width};
  height: ${(props) => props.theme.size.avatar.height};
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.initials};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
  ${textStyle('2xl')}
  font-weight: ${(props) => props.theme.fontWeight.medium};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

// The ring in the color of the card separates the badge from the avatar below it
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
    ${(props) => props.theme.colors.background};
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

const PlayerName = styled(Label)`
  color: ${(props) => props.theme.colors.text.muted};
  overflow-wrap: break-word;
`

// Long names wrap (German words hyphenated, lang="de") instead of widening the card
const CharacterName = styled.strong`
  ${textStyle('2xl')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
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
  background-color: ${(props) => props.theme.colors.secondary};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.md};
`

interface PlayerHeroCardProps {
  player: Player
  // Level of all players of the adventure
  level: number
}

// A player with their character: avatar (or the initials of the character name) with the level,
// player name, character name, race and class
function PlayerHeroCard({ player, level }: PlayerHeroCardProps): ReactElement {
  return (
    <Card aria-label={player.character_name} data-test-id={`player-${player.id}`} lang="de">
      <AvatarWrap>
        <Avatar data-test-id="player-avatar">
          {player.avatar
            ? <img src={mediaUrl(player.avatar.source)} alt="" />
            : <span aria-hidden="true">{characterInitials(player.character_name)}</span>}
        </Avatar>
        <LevelBadge data-test-id="player-level">{level}</LevelBadge>
      </AvatarWrap>
      <Info>
        <PlayerName data-test-id="player-name">{player.player_name}</PlayerName>
        <CharacterName data-test-id="player-character">{player.character_name}</CharacterName>
        <Chips>
          <Chip data-test-id="player-race">{player.race}</Chip>
          <Chip data-test-id="player-class">{player.character_class}</Chip>
        </Chips>
      </Info>
    </Card>
  )
}

export default PlayerHeroCard
