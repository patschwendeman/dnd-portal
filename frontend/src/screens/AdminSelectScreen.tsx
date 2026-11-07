import {
  ReactElement, ReactNode, useContext, useEffect, useState,
} from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ReactSVG } from 'react-svg'
import styled, { keyframes, useTheme } from 'styled-components'

import { ADMIN_PLAY_PATH, ADMIN_SELECT_PATH } from '../app/adminPaths'
import AdventureBackground from '../components/AdventureBackground'
import AdventureCard from '../components/AdventureCard'
import Label from '../components/Label'
import { TextButton } from '../components/TextButton'
import { ActiveAdventureContext, FightContext } from '../context/context'
import { AdventureSummary } from '../models/models'
import { getAdventures, saveActiveAdventure } from '../service/adminScreen'
import GlobalStyle, { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import PageTransitionStyle from '../style/PageTransitionStyle'
import { textStyle } from '../style/tokens'
import { AdminEntrance, readSelectReturn } from '../utils/adminEntrance'
import { adventureSelectStatus, isAdventureLocked } from '../utils/adventureSelect'
import { loadLatest } from '../utils/loadSafely'
import { useAdventureBackground } from '../utils/useAdventureBackground'
import { isHeroShown, startPageTransition } from '../utils/viewTransition'

import infoIcon from '/assets/icons/info.svg'
import reloadIcon from '/assets/icons/reload.svg'
import wifiOffIcon from '/assets/icons/wifiOff.svg'

// Narrowest card; the grid gets as many columns as fit
const ADVENTURE_CARD_MIN_WIDTH = '340px'
// Keeps the cards readable on a wide monitor instead of stretching them over the whole width
const ADVENTURE_SELECT_MAX_WIDTH = '1200px'
const STATE_ICON_SIZE = '40px'
const SKELETON_CARDS = [0, 1, 2]
const SKELETON_TEXT_HEIGHT = '16px'

const pulse = keyframes`
  50% { opacity: .45; }
`

const Screen = styled.div`
  position: fixed;
  inset: 0;
  overflow-y: auto;
  color: ${(props) => props.theme.colors.text.color};
`

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[5]};
  max-width: ${ADVENTURE_SELECT_MAX_WIDTH};
  margin: 0 auto;
  padding: ${(props) => props.theme.space[6]} ${(props) => props.theme.space[5]};
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
`

const Heading = styled.h1`
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const Notice = styled.div<TileSurfaceProps>`
  ${tileSurface}
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[3]} ${(props) => props.theme.space[4]};
  border-color: ${(props) => props.theme.colors.primary};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const ErrorNotice = styled(Notice)`
  background-color: ${(props) => props.theme.colors.error};
  color: ${(props) => props.theme.colors.onError};
  border-color: ${(props) => props.theme.colors.error};
`

const Cards = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, ${ADVENTURE_CARD_MIN_WIDTH}), 1fr));
  gap: ${(props) => props.theme.space[5]};
  padding: 0;
  list-style: none;
`

const SkeletonCard = styled.li<TileSurfaceProps>`
  ${tileSurface}
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  padding-bottom: ${(props) => props.theme.space[4]};
  overflow: hidden;

  > span {
    display: block;
    margin: 0 ${(props) => props.theme.space[4]};
    height: ${SKELETON_TEXT_HEIGHT};
    border-radius: ${(props) => props.theme.radius.sm};
    background-color: ${(props) => props.theme.colors.background};
    animation: ${pulse} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  > span:nth-child(2) {
    width: 60%;
  }

  > span:first-child {
    margin: 0;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 0;
  }
`

const State = styled.div<TileSurfaceProps>`
  ${tileSurface}
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[6]} ${(props) => props.theme.space[5]};
  text-align: center;
`

const StateTitle = styled.h2`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const RetryButton = styled(TextButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[2]};
`

const IconBox = styled.span<{ $size: string }>`
  display: block;
  flex: none;

  svg {
    display: block;
    width: ${(props) => props.$size};
    height: ${(props) => props.$size};
  }
`

interface IconProps {
  src: string
  /** Default: the size of an icon beside text */
  size?: string
}

function Icon({ src, size = undefined }: IconProps): ReactElement {
  const theme = useTheme()
  return (
    <IconBox $size={size ?? theme.size.icon} aria-hidden="true">
      <ReactSVG src={src} />
    </IconBox>
  )
}

/**
 * Start of the Admin: the adventures as cards. A click on a card makes it the active adventure of
 * the game table and opens the Admin; the active one opens it without a write. During a fight only
 * the active adventure can be opened. Both ways into the Admin, and the way back after ending the
 * adventure, are a page transition in which the image of the card becomes the background.
 */
function AdminSelectScreen(): ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  // The card whose image is shared with the Admin: the ended adventure, later the clicked one
  const [heroId, setHeroId] = useState<number | null>(() => readSelectReturn(location.state))
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { fight } = useContext(FightContext)
  const isFighting = fight !== null
  const [adventures, setAdventures] = useState<AdventureSummary[]>()
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const [reloadCount, setReloadCount] = useState<number>(0)
  const [isStarting, setIsStarting] = useState<boolean>(false)
  const [startFailed, setStartFailed] = useState<boolean>(false)

  // history.state survives a reload, which must not look like the way back from the Admin
  useEffect(() => {
    if (location.state !== null) {
      navigate(ADMIN_SELECT_PATH, { replace: true, state: null })
    }
  }, [location.state, navigate])

  useEffect(() => {
    let stale = false

    loadLatest(
      getAdventures,
      (loaded) => {
        setAdventures(loaded)
        setLoadFailed(false)
      },
      (err) => {
        console.error('Error fetching adventures:', err)
        setLoadFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [reloadCount])

  const activeAdventure = adventures?.find((adventure) => adventure.id === activeAdventureId)
  const background = useAdventureBackground(activeAdventure)
  const isTranslucent = background.isImageShown
  const status = adventureSelectStatus(adventures, loadFailed)

  // The name moves to the clicked card before the transition captures the selection
  const enter = (adventure: AdventureSummary) => {
    const entrance: AdminEntrance = { entrance: 'select', image: adventure.image?.source ?? null }
    flushSync(() => setHeroId(adventure.id))
    startPageTransition(
      () => navigate(ADMIN_PLAY_PATH, { state: entrance }),
      entrance.image === null ? null : isHeroShown,
    )
  }

  // The Admin opens only after the write succeeded, so it never shows the previous adventure
  const select = (adventure: AdventureSummary) => {
    if (adventure.id === activeAdventureId) {
      enter(adventure)
      return
    }
    if (isStarting) {
      return
    }
    setIsStarting(true)
    setStartFailed(false)
    saveActiveAdventure(adventure.id)
      .then(() => enter(adventure))
      .catch((err) => {
        console.error('Error starting adventure:', err)
        setIsStarting(false)
        setStartFailed(true)
      })
  }

  let content: ReactNode
  if (status === 'list' && adventures !== undefined) {
    content = (
      <Cards>
        {adventures.map((adventure, position) => (
          <li key={adventure.id}>
            <AdventureCard
              adventure={adventure}
              isActive={adventure.id === activeAdventureId}
              isLocked={isAdventureLocked(adventure.id, activeAdventureId, isFighting)}
              isTranslucent={isTranslucent}
              onSelect={select}
              position={position}
              isHero={adventure.id === heroId}
            />
          </li>
        ))}
      </Cards>
    )
  } else if (status === 'loading') {
    content = (
      <Cards aria-label="Lädt" aria-busy="true" data-test-id="adventure-select-loading">
        {SKELETON_CARDS.map((card) => (
          <SkeletonCard key={card} $isTranslucent={isTranslucent}>
            <span />
            <span />
            <span />
          </SkeletonCard>
        ))}
      </Cards>
    )
  } else if (status === 'empty') {
    content = (
      <State data-test-id="adventure-select-state" $isTranslucent={isTranslucent}>
        <StateTitle>Noch keine Abenteuer</StateTitle>
      </State>
    )
  } else {
    content = (
      <State data-test-id="adventure-select-state" $isTranslucent={isTranslucent}>
        <Icon src={wifiOffIcon} size={STATE_ICON_SIZE} />
        <StateTitle>Keine Verbindung zum Server</StateTitle>
        <RetryButton
          type="button"
          $variant="cancel"
          data-test-id="adventure-select-retry"
          onClick={() => setReloadCount((count) => count + 1)}
        >
          <Icon src={reloadIcon} />
          Erneut versuchen
        </RetryButton>
      </State>
    )
  }

  return (
    <>
      <GlobalStyle />
      <PageTransitionStyle />
      <AdventureBackground
        layers={background.layers}
        shown={background.shown}
        onLoad={background.onLoad}
        onError={background.onError}
      />
      <Screen data-test-id="adventure-select" data-status={status}>
        <Page>
          <Header data-view-head>
            <Label>Spielleiter</Label>
            <Heading>Abenteuer wählen</Heading>
          </Header>
          {isFighting && status === 'list' && (
            <Notice
              role="status"
              data-test-id="adventure-select-fight"
              $isTranslucent={isTranslucent}
            >
              <Icon src={infoIcon} />
              Im aktiven Abenteuer läuft ein Kampf. Andere Abenteuer sind bis zu seinem Ende
              gesperrt.
            </Notice>
          )}
          {startFailed && (
            <ErrorNotice role="alert" data-test-id="adventure-select-error">
              Das Abenteuer konnte nicht gestartet werden.
            </ErrorNotice>
          )}
          {content}
        </Page>
      </Screen>
    </>
  )
}

export default AdminSelectScreen
