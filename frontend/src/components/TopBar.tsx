import { Fragment, FunctionComponent, ReactElement } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { textStyle } from '../style/tokens'
import { playAtmoSounds } from '../utils/utils'

import buffIcon from '/assets/icons/buff.svg'
import buffSound from '/assets/sounds/buff.wav'
import music1Icon from '/assets/icons/music.svg'
import music1Sound from '/assets/sounds/music_1.wav'
import music2Icon from '/assets/icons/music_2.svg'
import music2Sound from '/assets/sounds/music_2.wav'
import heartIcon from '/assets/icons/heart.svg'
import healSound from '/assets/sounds/heal.wav'
import bottleIcon from '/assets/icons/bottle.svg'
import bottleSound from '/assets/sounds/bottle.wav'
import spell1Icon from '/assets/icons/bold.svg'
import spell1Sound from '/assets/sounds/spell_1.wav'
import spell2Icon from '/assets/icons/star_2.svg'
import spell2Sound from '/assets/sounds/spell_2.wav'
import debuff1Icon from '/assets/icons/eye.svg'
import debuff1Sound from '/assets/sounds/debuff_1.mp3'
import debuff2Icon from '/assets/icons/ghost.svg'
import debuff2Sound from '/assets/sounds/debuff_2.wav'
import lockIcon from '/assets/icons/lock.svg'
import lockSound from '/assets/sounds/lock.wav'
import settingsIcon from '/assets/icons/settings.svg'

const OUTER_COLUMN_WIDTH = '240px'

const Bar = styled.div`
    display: grid;
    grid-template-columns: ${OUTER_COLUMN_WIDTH} 1fr ${OUTER_COLUMN_WIDTH};
    align-items: center;
    padding: 0 ${(props) => props.theme.space[5]};
    background-color: ${(props) => props.theme.colors.background};
    border-bottom: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.secondary};
`

const Title = styled.span`
    ${textStyle('md')}
    font-weight: ${(props) => props.theme.fontWeight.bold};
`

const Sounds = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${(props) => props.theme.space[4]};
`

const SoundGroup = styled.div`
    display: flex;
    gap: ${(props) => props.theme.space[1]};
`

const Separator = styled.div`
    width: ${(props) => props.theme.borderWidth.thin};
    height: ${(props) => props.theme.size.icon};
    background-color: ${(props) => props.theme.colors.border};
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

const ThemeToggleButton = styled.button`
    display: grid;
    place-items: center;
    justify-self: end;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    padding: 0;
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;

    svg {
        display: block;
        width: ${(props) => props.theme.size.icon};
        height: ${(props) => props.theme.size.icon};
    }
`

interface AdminScreenProps {
  toggleTheme: () => void
}

const TopBar: FunctionComponent<AdminScreenProps> = ({
  toggleTheme,
}): ReactElement => {
  const theme = useTheme()

  const healAtmos = [
    {
      name: 'heal',
      icon: heartIcon,
      sound: healSound,
    },
    {
      name: 'bottle',
      icon: bottleIcon,
      sound: bottleSound,
    },
  ]
  const buffAtmos = [
    {
      name: 'buff',
      icon: buffIcon,
      sound: buffSound,
    },
    {
      name: 'music 1',
      icon: music1Icon,
      sound: music1Sound,
    },
    {
      name: 'music 2',
      icon: music2Icon,
      sound: music2Sound,
    },
  ]
  const spellsAtmos = [
    {
      name: 'spell 1',
      icon: spell1Icon,
      sound: spell1Sound,
    },
    {
      name: 'spell 2',
      icon: spell2Icon,
      sound: spell2Sound,
    },
  ]

  const debuffAtmos = [
    {
      name: 'debuff 1',
      icon: debuff1Icon,
      sound: debuff1Sound,
    },
    {
      name: 'debuff 2',
      icon: debuff2Icon,
      sound: debuff2Sound,
    },
  ]

  const otherAtmos = [
    {
      name: 'lock',
      icon: lockIcon,
      sound: lockSound,
    },
  ]

  const atmoGroups = [healAtmos, buffAtmos, spellsAtmos, debuffAtmos, otherAtmos]

  return (
    <Bar>
      <Title>DnD Portal</Title>
      <Sounds>
        {atmoGroups.map((atmos, groupIndex) => (
          <Fragment key={groupIndex}>
            {groupIndex > 0 && <Separator />}
            <SoundGroup>
              {atmos.map((atmo, i) => (
                <AtmoButton onClick={() => playAtmoSounds(atmo.sound)} key={i}>
                  <ReactSVG
                    src={atmo.icon}
                    beforeInjection={(svg) => {
                      svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
                    }}
                  />
                </AtmoButton>
              ))}
            </SoundGroup>
          </Fragment>
        ))}
      </Sounds>
      <ThemeToggleButton onClick={toggleTheme}>
        <ReactSVG
          src={settingsIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
          }}
        />
      </ThemeToggleButton>
    </Bar>
  )
}

export { TopBar }
