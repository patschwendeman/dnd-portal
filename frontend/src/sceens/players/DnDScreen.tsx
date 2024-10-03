import { FunctionComponent, ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import turnImg from '/rotate.png'
import settingsIcon from '/settings.svg'

import { ResourceBarPlayer } from '../../components/ResourceBarPlayer'


const Background = styled.div`
  display: flex;
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    user-select: none;
`

const Overlay = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9;
  img {
    width: 30%;
    z-index: 10;
  }
  @media (min-width: 650px) {
    display: none;
  }
`


const ThemeToggleButton = styled.button`
    position: fixed;
    left: 12px;
    top: 12px;
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
    width: 100%;
    height: 100%;
    }
    svg {
      width: 100%;
      height: 100%; 
    }
`

interface DnDScreenProps {
  toggleTheme: () => void;
}

const DnDScreen: FunctionComponent<DnDScreenProps> = ({ toggleTheme }): ReactElement => {
  const theme = useTheme()
  return (
    <Background>
    <Overlay>
      <img src={turnImg} alt='turn around' />
    </Overlay>
    <ThemeToggleButton onClick={toggleTheme}>
        <ReactSVG
        src={settingsIcon}
        beforeInjection={(svg) => {
          svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
        }}
      />
    </ThemeToggleButton>
    <ResourceBarPlayer />
  </Background>
  )
}

export { DnDScreen }
