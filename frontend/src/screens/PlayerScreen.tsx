import { FunctionComponent, ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme, keyframes } from 'styled-components'

import turnImg from '/assets/icons/phone.svg'
import settingsIcon from '/assets/icons/settings.svg'

import { ResourceBarPlayer } from '../components/ResourceBarPlayer'
import { GlobalStyle } from '../style/GlobalStyle'

// Layout constants (DESIGN.md 1.3)
const ROTATE_ICON_SIZE = '96px'
const PORTRAIT_QUERY = '(orientation: portrait)'

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-90deg); }
  50% { transform: rotate(-90deg); }
  75% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`

const Background = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[4]} max(${(props) => props.theme.space[5]}, env(safe-area-inset-left), env(safe-area-inset-right));
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.color};
  user-select: none;
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: none;
  place-content: center;
  justify-items: center;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[5]};
  text-align: center;
  background-color: ${(props) => props.theme.colors.background};
  svg {
    display: block;
    width: ${ROTATE_ICON_SIZE};
    height: ${ROTATE_ICON_SIZE};
    color: ${(props) => props.theme.colors.text.color};
    animation: ${rotateAnimation} 6s infinite ease-in-out;
  }
  @media ${PORTRAIT_QUERY} {
    display: grid;
  }
`

const OverlayText = styled.p`
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const ThemeToggleButton = styled.button`
  align-self: flex-start;
  width: ${(props) => props.theme.size.control.lg};
  height: ${(props) => props.theme.size.control.lg};
  padding: 0;
  display: grid;
  place-items: center;
  background-color: ${(props) => props.theme.colors.secondary};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;
  div {
    display: grid;
    place-items: center;
  }
  svg {
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
    color: ${(props) => props.theme.colors.text.color};
  }
`

interface PlayerScreenProps {
  toggleTheme: () => void;
}

const PlayerScreen: FunctionComponent<PlayerScreenProps> = ({ toggleTheme }): ReactElement => {
  const theme = useTheme()
  return (
    <>
      <GlobalStyle />
      <Background>
        <ThemeToggleButton onClick={toggleTheme}>
          <ReactSVG
            src={settingsIcon}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
        </ThemeToggleButton>
        <ResourceBarPlayer />
        <Overlay>
          <ReactSVG
            src={turnImg}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
          <OverlayText>Bitte das Handy quer halten</OverlayText>
        </Overlay>
      </Background>
    </>
  )
}

export { PlayerScreen }
