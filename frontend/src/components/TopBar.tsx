import { FunctionComponent, ReactElement } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

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

const Bar = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 50px;
    display: flex;
    /* background-color: ${(props) => props.theme.colors.secondary}; */
    background-color: ${(props) => props.theme.colors.background};
    border-bottom: 1px solid ${(props) => props.theme.colors.secondary};
    align-items: center;
    justify-content: center;

`
const Seperator = styled.div`
    width: 5px;
    height: 5px;
    margin: 0 20px 0 20px;
    border-radius: 100px;
    background-color: ${(props) => props.theme.colors.text.color};

`

const AtmoButton = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    /* background-color: ${(props) => props.theme.colors.background}; */
    color: ${(props) => props.theme.colors.text.color};
    z-index: 999;
    /* border: 1px solid ${(props) => props.theme.colors.text.color}; */
    border-radius: 100px;
    margin: 0 10px 0 10px;
    cursor: pointer;

    svg {
      width: 100%;
      height: 100%; 
    }
  
`

const ThemeToggleButton = styled.button`
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 20px;
    /* padding: 3px 22px; */
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    /* border-radius: 5px; */
    cursor: pointer;
    z-index: 99;
    svg {
        width: 30px;
        height: 100%; 
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

  return (
    <Bar>
      {healAtmos.map((content, i) => (
        <AtmoButton onClick={() => playAtmoSounds(healAtmos[i].sound)} key={i}>
          <ReactSVG
            src={healAtmos[i].icon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </AtmoButton>
      ))}
      <Seperator></Seperator>
      {buffAtmos.map((content, i) => (
        <AtmoButton onClick={() => playAtmoSounds(buffAtmos[i].sound)} key={i}>
          <ReactSVG
            src={buffAtmos[i].icon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </AtmoButton>
      ))}
      <Seperator></Seperator>
      {spellsAtmos.map((content, i) => (
        <AtmoButton
          onClick={() => playAtmoSounds(spellsAtmos[i].sound)}
          key={i}
        >
          <ReactSVG
            src={spellsAtmos[i].icon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </AtmoButton>
      ))}
      <Seperator></Seperator>
      {debuffAtmos.map((content, i) => (
        <AtmoButton
          onClick={() => playAtmoSounds(debuffAtmos[i].sound)}
          key={i}
        >
          <ReactSVG
            src={debuffAtmos[i].icon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </AtmoButton>
      ))}
      <Seperator></Seperator>
      {otherAtmos.map((content, i) => (
        <AtmoButton onClick={() => playAtmoSounds(otherAtmos[i].sound)} key={i}>
          <ReactSVG
            src={otherAtmos[i].icon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </AtmoButton>
      ))}
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
