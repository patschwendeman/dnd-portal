import { ReactElement } from 'react'
import styled from 'styled-components'

import PlayerListItem from './PlayerListItem'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'

// Always one column: one player per row reads faster at the table than a grid
const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[2]};
  padding: 0;
  list-style: none;
`

const NoPlayers = styled.p`
  ${textStyle('sm')}
`

interface PlayersPanelProps {
  // In the order of the API; empty without an adventure
  players: Player[]
}

// Content of the dashboard panel "Party": one row per player of the active adventure
function PlayersPanel({ players }: PlayersPanelProps): ReactElement {
  if (players.length === 0) {
    return <NoPlayers data-test-id="no-players">Keine Spieler</NoPlayers>
  }
  return (
    <List>
      {players.map((player) => <PlayerListItem key={player.id} player={player} />)}
    </List>
  )
}

export default PlayersPanel
