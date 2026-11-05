import {
  ReactElement, useContext, useEffect, useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReactSVG } from 'react-svg'
import styled, { useTheme, keyframes } from 'styled-components'

import turnImg from '/assets/icons/phone.svg'

import { usePlayerOutlet } from './PlayerLayout'
import ResourceBarPlayer from '../components/ResourceBarPlayer'
import SettingsMenu from '../components/SettingsMenu'
import { ActiveAdventureContext, GameTableContext } from '../context/context'
import GlobalStyle from '../style/GlobalStyle'
import { isPlayerOf, parsePlayerId, playerRedirect } from '../utils/playerSelect'

const ROTATE_ICON_SIZE = '96px'
const PORTRAIT_QUERY = '(orientation: portrait)'

const rotateAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-90deg); }
  50% { transform: rotate(-90deg); }
  75% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`

// Transparent: the background image of the adventure lies behind it
const Screen = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[4]}
    max(${(props) => props.theme.space[5]}, env(safe-area-inset-left), env(safe-area-inset-right));
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
  z-index: ${(props) => props.theme.layer.dialog};
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

// The resources of the character with the ID from the URL; returns to the selection once the
// character does not belong to the active adventure
function PlayerScreen(): ReactElement {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { hasState } = useContext(GameTableContext)
  const {
    themeOverride, onChangeThemeOverride, players, isTranslucent, setAdventureNotice,
  } = usePlayerOutlet()
  const playerId = parsePlayerId(id)

  // Remembered during render, so a later change of the adventure can be told from an old link
  const isPlayer = activeAdventureId !== null && isPlayerOf(playerId, players)
  const [wasPlayer, setWasPlayer] = useState(isPlayer)
  if (isPlayer && !wasPlayer) {
    setWasPlayer(true)
  }

  const redirect = playerRedirect({
    playerId, hasState, activeAdventureId, players, wasPlayer: wasPlayer || isPlayer,
  })
  useEffect(() => {
    if (redirect === 'stay') {
      return
    }
    setAdventureNotice(redirect === 'selectWithNotice')
    navigate('/', { replace: true })
  }, [redirect, navigate, setAdventureNotice])

  return (
    <>
      <GlobalStyle />
      <Screen data-test-id="player-screen">
        <SettingsMenu
          themeOverride={themeOverride}
          onChangeThemeOverride={onChangeThemeOverride}
          onSwitchCharacter={() => navigate('/')}
          isTranslucent={isTranslucent}
        />
        <ResourceBarPlayer isTranslucent={isTranslucent} />
        <Overlay>
          <ReactSVG
            src={turnImg}
            beforeInjection={(svg) => {
              svg.setAttribute('style', `fill: ${theme.colors.text.color}`)
            }}
          />
          <OverlayText>Bitte das Handy quer halten</OverlayText>
        </Overlay>
      </Screen>
    </>
  )
}

export default PlayerScreen
