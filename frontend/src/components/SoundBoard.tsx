import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import { SOUND_GROUPS } from '../audio/sounds'
import { SoundName } from '../models/models'

const Sounds = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    /* Groups wrap in the narrow panel, so they are set apart by the gap instead of separator lines
       (a line would end up at the end or start of a row); rows closer together to fit the fixed
       height */
    row-gap: ${(props) => props.theme.space[2]};
    column-gap: ${(props) => props.theme.space[4]};
`

const SoundGroup = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${(props) => props.theme.space[1]};
`

const AtmoButton = styled.div`
    display: grid;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    color: ${(props) => props.theme.colors.text.color};
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
`

interface SoundBoardProps {
  onPlaySound: (name: SoundName) => void
}

// Content of the dashboard panel "Sounds": one button per sound effect, in its groups
function SoundBoard({ onPlaySound }: SoundBoardProps): ReactElement {
  const theme = useTheme()

  return (
    <Sounds data-test-id="sound-board">
      {SOUND_GROUPS.map((sounds) => (
        // Sound names are unique, so the first one identifies the group
        <SoundGroup key={sounds[0].name}>
          {sounds.map((sound) => (
            <AtmoButton
              onClick={() => onPlaySound(sound.name)}
              key={sound.name}
              data-test-id={`sound-${sound.name}`}
            >
              <ReactSVG
                src={sound.icon}
                beforeInjection={(svg) => {
                  svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
                }}
              />
            </AtmoButton>
          ))}
        </SoundGroup>
      ))}
    </Sounds>
  )
}

export default SoundBoard
