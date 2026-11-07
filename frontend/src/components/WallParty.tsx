import { ReactElement } from 'react'
import styled from 'styled-components'

import WallCharacterTile from './WallCharacterTile'
import { Player } from '../models/models'
import { firstName } from '../utils/fight'
import { characterInitials } from '../utils/player'
import { playerDetails } from '../utils/wallInitiative'
import splitParty from '../utils/wallParty'

const Side = styled.section<{ $side: 'left' | 'right' }>`
  position: fixed;
  top: 0;
  bottom: 0;
  ${(props) => props.$side}: ${(props) => props.theme.space[6]};
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${(props) => props.theme.space[4]};
  padding-block: ${(props) => props.theme.space[7]};
  z-index: ${(props) => props.theme.layer.tiles};
`

interface WallPartyProps {
  players: Player[]
}

/** The players of the active adventure at the left and the right edge of the Wall */
function WallParty({ players }: WallPartyProps): ReactElement {
  const { left, right } = splitParty(players)
  const sides = [['left', left], ['right', right]] as const
  return (
    <>
      {sides.map(([side, sidePlayers]) => (
        <Side key={side} $side={side} aria-label="Party" data-test-id={`wall-party-${side}`}>
          {sidePlayers.map((player) => (
            <WallCharacterTile
              key={player.id}
              variant="party"
              kind="player"
              avatarText={characterInitials(player.character_name)}
              image={player.avatar}
              name={firstName(player)}
              details={playerDetails(player)}
              testId="wall-party-tile"
            />
          ))}
        </Side>
      ))}
    </>
  )
}

export default WallParty
