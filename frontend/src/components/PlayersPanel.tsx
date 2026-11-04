import { ReactElement } from 'react'
import styled from 'styled-components'

import { RowList } from './ListRow'
import PlayerListItem from './PlayerListItem'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'

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
    <RowList>
      {players.map((player) => <PlayerListItem key={player.id} player={player} />)}
    </RowList>
  )
}

export default PlayersPanel
