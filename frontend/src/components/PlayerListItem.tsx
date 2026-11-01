import { ReactElement } from 'react'
import styled from 'styled-components'

import { mediaUrl } from '../api/mediaUrl'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'
import { characterInitials } from '../utils/player'

const PLAYER_AVATAR_SIZE = '40px'

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  min-width: 0;
  padding: ${(props) => props.theme.space[2]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.lg};
`

const Avatar = styled.div`
  display: grid;
  flex: none;
  place-items: center;
  width: ${PLAYER_AVATAR_SIZE};
  height: ${PLAYER_AVATAR_SIZE};
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.initials};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.md};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

// Long names wrap (German words hyphenated, lang="de") instead of widening the row
const Info = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-wrap: break-word;
  hyphens: auto;
`

const CharacterName = styled.strong`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const Meta = styled.span`
  ${textStyle('sm')}
  color: ${(props) => props.theme.colors.text.muted};
`

interface PlayerListItemProps {
  player: Player
}

function PlayerListItem({ player }: PlayerListItemProps): ReactElement {
  return (
    <Item aria-label={player.character_name} data-test-id={`player-${player.id}`} lang="de">
      <Avatar data-test-id="player-avatar">
        {player.avatar
          ? <img src={mediaUrl(player.avatar.source)} alt="" />
          : <span aria-hidden="true">{characterInitials(player.character_name)}</span>}
      </Avatar>
      <Info>
        <CharacterName data-test-id="player-character">{player.character_name}</CharacterName>
        <Meta>
          <span data-test-id="player-race">{player.race}</span>
          {' · '}
          <span data-test-id="player-class">{player.character_class}</span>
          {' · '}
          <span data-test-id="player-name">{player.player_name}</span>
        </Meta>
      </Info>
    </Item>
  )
}

export default PlayerListItem
