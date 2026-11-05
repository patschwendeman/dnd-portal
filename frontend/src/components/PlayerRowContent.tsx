import { ReactElement } from 'react'

import CombatantAvatar from './CombatantAvatar'
import { RowDetails, RowInfo, RowName } from './ListRow'
import { Player } from '../models/models'
import { characterInitials } from '../utils/player'

interface PlayerRowContentProps {
  player: Player
}

// Avatar, character name and "Volk · Klasse · Spielername" of a player row, in the party of the
// Admin and in the character selection
function PlayerRowContent({ player }: PlayerRowContentProps): ReactElement {
  return (
    <>
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
    </>
  )
}

export default PlayerRowContent
