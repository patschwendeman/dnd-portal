import { ReactElement } from 'react'

import { ListRow } from './ListRow'
import PlayerRowContent from './PlayerRowContent'
import { Player } from '../models/models'

interface PlayerListItemProps {
  player: Player
}

function PlayerListItem({ player }: PlayerListItemProps): ReactElement {
  return (
    <ListRow aria-label={player.character_name} data-test-id={`player-${player.id}`} lang="de">
      <PlayerRowContent player={player} />
    </ListRow>
  )
}

export default PlayerListItem
