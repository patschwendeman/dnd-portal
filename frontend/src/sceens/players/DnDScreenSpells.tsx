import { FunctionComponent, ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import settingsIcon from '/settings.svg'

import { ResourceBarPlayer } from '../../components/ResourceBarPlayer'
import { SliderPlayer } from '../../components/SliderPlayer'
import { SpellBarPlayer } from '../../components/SpellbarPlayer'



const Background = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: space-between;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.color};
  user-select: none;
  @media (max-width: 649px) {
    align-items: end;
    flex-direction: row;
    justify-content: center;
  }
`

const ThemeToggleButton = styled.button`
    position: fixed;
    left: 12px;
    top: 50%;
    display: flex;
    padding: 6px;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    background-color: ${(props) => props.theme.colors.secondary};
    border: none;
    border-radius: 100px;
    cursor: pointer;
    div {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    }
    svg {
      width: 100%;
      height: 100%; 
    }
    @media (max-width: 649px) {
      top: 12px;
  }
`

interface DnDScreenProps {
  toggleTheme: () => void;
}

const DnDSpellsScreen: FunctionComponent<DnDScreenProps> = ({ toggleTheme }): ReactElement => {
  const theme = useTheme()

  return (
  <Background>
    <SliderPlayer />
    <ThemeToggleButton onClick={toggleTheme}>
        <ReactSVG
          src={settingsIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
          }}
      />
    </ThemeToggleButton>
    <SpellBarPlayer />
    <ResourceBarPlayer />
  </Background>
  )
}

export { DnDSpellsScreen }
