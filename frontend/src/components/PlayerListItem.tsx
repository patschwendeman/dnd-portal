import { ReactElement } from 'react'

import CombatantAvatar from './CombatantAvatar'
import {
  ListRow, RowDetails, RowInfo, RowName,
} from './ListRow'
import { Player } from '../models/models'
import { characterInitials } from '../utils/player'

interface PlayerListItemProps {
  player: Player
}

function PlayerListItem({ player }: PlayerListItemProps): ReactElement {
  return (
    <ListRow aria-label={player.character_name} data-test-id={`player-${player.id}`} lang="de">
      <CombatantAvatar
        kind="player"
        text={characterInitials(player.character_name)}
        image={player.avatar}
        testId="player-avatar"
      />
      <RowInfo>
        <RowName data-test-id="player-character">{player.character_name}</RowName>
        <RowDetails>
          <span data-test-id="player-race">{player.race}</span>
          {' · '}
          <span data-test-id="player-class">{player.character_class}</span>
          {' · '}
          <span data-test-id="player-name">{player.player_name}</span>
        </RowDetails>
      </RowInfo>
    </ListRow>
  )
}

export default PlayerListItem
