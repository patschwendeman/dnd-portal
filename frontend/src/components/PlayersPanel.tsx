import { ReactElement } from 'react'
import styled from 'styled-components'

import PlayerHeroCard from './PlayerHeroCard'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[4]};
`

const NoPlayers = styled.p`
  ${textStyle('sm')}
`

interface PlayersPanelProps {
  // In the order of the API; empty without an adventure
  players: Player[]
  level: number
}

// Content of the dashboard panel "Spieler": one hero card per player of the active adventure
function PlayersPanel({ players, level }: PlayersPanelProps): ReactElement {
  if (players.length === 0) {
    return <NoPlayers data-test-id="no-players">Keine Spieler</NoPlayers>
  }
  return (
    <Cards>
      {players.map((player) => <PlayerHeroCard key={player.id} player={player} level={level} />)}
    </Cards>
  )
}

export default PlayersPanel
