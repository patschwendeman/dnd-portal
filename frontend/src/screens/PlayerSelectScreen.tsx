import { ReactElement, ReactNode, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactSVG } from 'react-svg'
import styled, { keyframes, useTheme } from 'styled-components'

import chevronRightIcon from '/assets/icons/chevronRight.svg'
import hourglassIcon from '/assets/icons/hourglass.svg'
import infoIcon from '/assets/icons/info.svg'
import peopleIcon from '/assets/icons/people.svg'
import reloadIcon from '/assets/icons/reload.svg'
import wifiOffIcon from '/assets/icons/wifiOff.svg'

import { usePlayerOutlet } from './PlayerLayout'
import Label from '../components/Label'
import { ListRow } from '../components/ListRow'
import PlayerRowContent from '../components/PlayerRowContent'
import SettingsMenu from '../components/SettingsMenu'
import { TextButton } from '../components/TextButton'
import { ActiveAdventureContext, GameTableContext } from '../context/context'
import { Player } from '../models/models'
import GlobalStyle, { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { playerSelectStatus } from '../utils/playerSelect'

// Narrowest column of the list; in landscape the list gets as many columns as fit
const CHARACTER_COLUMN_MIN_WIDTH = '280px'
const STATE_ICON_SIZE = '40px'
const STATE_TEXT_MAX_WIDTH = '320px'
const SKELETON_ROWS = [0, 1, 2]
const SKELETON_BAR_HEIGHT = '12px'

const pulse = keyframes`
  50% { opacity: .45; }
`

// Scrolls as a whole when the list does not fit; no hint to turn the phone
const Screen = styled.div`
  position: fixed;
  inset: 0;
  overflow-y: auto;
  color: ${(props) => props.theme.colors.text.color};
`

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[4]};
  padding: max(${(props) => props.theme.space[4]}, env(safe-area-inset-top))
    max(${(props) => props.theme.space[5]}, env(safe-area-inset-left), env(safe-area-inset-right))
    max(${(props) => props.theme.space[4]}, env(safe-area-inset-bottom));
`

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
`

const Title = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  min-width: 0;
`

const AdventureName = styled(Label)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const Heading = styled.h1`
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const IconBox = styled.span<{ $size: string }>`
  display: block;
  flex: none;
  div {
    display: grid;
    place-items: center;
  }
  svg {
    width: ${(props) => props.$size};
    height: ${(props) => props.$size};
  }
`

const Notice = styled.div<TileSurfaceProps>`
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[3]} ${(props) => props.theme.space[4]};
  ${tileSurface}
  border-color: ${(props) => props.theme.colors.primary};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const Card = styled.section<TileSurfaceProps>`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[5]};
  ${tileSurface}
`

const CharacterList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, ${CHARACTER_COLUMN_MIN_WIDTH}), 1fr));
  gap: ${(props) => props.theme.space[2]};
  padding: 0;
  list-style: none;
`

const CharacterButton = styled(ListRow).attrs({ as: 'button' })`
  width: 100%;
  min-height: ${(props) => props.theme.size.control.lg};
  border: none;
  font: inherit;
  text-align: left;
  color: ${(props) => props.theme.colors.text.color};
  cursor: pointer;

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

const SkeletonRow = styled(ListRow)`
  min-height: ${(props) => props.theme.size.control.lg};
`

const SkeletonBlock = styled.span<{ $width: string, $height: string }>`
  display: block;
  flex: none;
  width: ${(props) => props.$width};
  height: ${(props) => props.$height};
  border-radius: ${(props) => props.theme.radius.sm};
  background-color: ${(props) => props.theme.colors.secondary};
  animation: ${pulse} 1.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const SkeletonText = styled.span`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${(props) => props.theme.space[2]};
`

const State = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[5]} ${(props) => props.theme.space[2]};
  text-align: center;
`

const StateTitle = styled.h2`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const StateText = styled.p`
  max-width: ${STATE_TEXT_MAX_WIDTH};
  ${textStyle('sm')}
`

const RetryButton = styled(TextButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[2]};
  height: ${(props) => props.theme.size.control.lg};
`

interface IconProps {
  src: string
  size: string
  color: string
}

function Icon({ src, size, color }: IconProps): ReactElement {
  return (
    <IconBox $size={size} aria-hidden="true">
      <ReactSVG
        src={src}
        beforeInjection={(svg) => {
          svg.setAttribute('style', `fill: ${color}`)
        }}
      />
    </IconBox>
  )
}

interface CardStateProps {
  icon: string
  title: string
  text: string
  children?: ReactNode
}

function CardState({
  icon, title, text, children = null,
}: CardStateProps): ReactElement {
  const theme = useTheme()
  return (
    <State data-test-id="select-state">
      <Icon src={icon} size={STATE_ICON_SIZE} color={theme.colors.text.color} />
      <StateTitle>{title}</StateTitle>
      <StateText>{text}</StateText>
      {children}
    </State>
  )
}

function SkeletonList(): ReactElement {
  const theme = useTheme()
  return (
    <CharacterList aria-label="Lädt" aria-busy="true" data-test-id="select-loading">
      {SKELETON_ROWS.map((row) => (
        <SkeletonRow key={row}>
          <SkeletonBlock $width={theme.size.control.md} $height={theme.size.control.md} />
          <SkeletonText>
            <SkeletonBlock $width="60%" $height={SKELETON_BAR_HEIGHT} />
            <SkeletonBlock $width="85%" $height={SKELETON_BAR_HEIGHT} />
          </SkeletonText>
        </SkeletonRow>
      ))}
    </CharacterList>
  )
}

interface CharacterListProps {
  players: Player[]
  onSelect: (player: Player) => void
}

function Characters({ players, onSelect }: CharacterListProps): ReactElement {
  const theme = useTheme()
  return (
    <CharacterList>
      {players.map((player) => (
        <li key={player.id}>
          <CharacterButton
            type="button"
            lang="de"
            data-test-id={`character-${player.id}`}
            onClick={() => onSelect(player)}
          >
            <PlayerRowContent player={player} />
            <Icon src={chevronRightIcon} size={theme.size.icon} color={theme.colors.text.muted} />
          </CharacterButton>
        </li>
      ))}
    </CharacterList>
  )
}

// Target of the QR code: the characters of the active adventure; a tap opens the Player Screen of
// the character. Gives no access to Admin, Wall or Ground.
function PlayerSelectScreen(): ReactElement {
  const theme = useTheme()
  const navigate = useNavigate()
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { hasState, connected, reconnectNow } = useContext(GameTableContext)
  const {
    themeOverride, onChangeThemeOverride, adventureName, players, loadFailed, retryLoad,
    isTranslucent, hasAdventureNotice, setAdventureNotice,
  } = usePlayerOutlet()
  const status = playerSelectStatus({
    hasState, connected, activeAdventureId, players, loadFailed,
  })

  const select = (player: Player) => {
    setAdventureNotice(false)
    navigate(`/player/${player.id}`)
  }

  const retry = () => {
    if (!connected) {
      reconnectNow()
    }
    if (loadFailed) {
      retryLoad()
    }
  }

  let content: ReactNode
  if (status === 'list' && players !== null) {
    content = <Characters players={players} onSelect={select} />
  } else if (status === 'loading') {
    content = <SkeletonList />
  } else if (status === 'noAdventure') {
    content = (
      <CardState
        icon={hourglassIcon}
        title="Noch kein Abenteuer aktiv"
        text="Sobald der Spielleiter ein Abenteuer startet, erscheinen hier die Charaktere."
      />
    )
  } else if (status === 'noCharacters') {
    content = (
      <CardState
        icon={peopleIcon}
        title="Noch keine Charaktere"
        text="In diesem Abenteuer sind noch keine Charaktere angelegt."
      />
    )
  } else {
    content = (
      <CardState
        icon={wifiOffIcon}
        title="Keine Verbindung zum Spieltisch"
        text="Ist dein Handy im selben WLAN wie der Rechner des Spielleiters?"
      >
        <RetryButton type="button" $variant="cancel" data-test-id="retry" onClick={retry}>
          <Icon src={reloadIcon} size={theme.size.icon} color={theme.colors.text.color} />
          Erneut versuchen
        </RetryButton>
      </CardState>
    )
  }

  const showsAdventure = status === 'list' || status === 'noCharacters'

  return (
    <>
      <GlobalStyle />
      <Screen data-test-id="player-select" data-status={status}>
        <Page>
          <Header>
            <Title>
              {showsAdventure && adventureName !== null && (
                <AdventureName data-test-id="select-adventure">{adventureName}</AdventureName>
              )}
              <Heading>Charakter wählen</Heading>
            </Title>
            <SettingsMenu
              themeOverride={themeOverride}
              onChangeThemeOverride={onChangeThemeOverride}
              placement="end"
              isTranslucent={isTranslucent}
            />
          </Header>
          {hasAdventureNotice && (
            <Notice role="status" data-test-id="select-notice" $isTranslucent={isTranslucent}>
              <Icon src={infoIcon} size={theme.size.icon} color={theme.colors.primary} />
              <span>Der Spielleiter hat das Abenteuer gewechselt. Wähle deinen Charakter neu.</span>
            </Notice>
          )}
          <Card aria-label="Party" data-test-id="select-party" $isTranslucent={isTranslucent}>
            <Label data-test-id="select-party-label">
              {status === 'list' && players !== null ? `Party · ${players.length}` : 'Party'}
            </Label>
            {content}
          </Card>
        </Page>
      </Screen>
    </>
  )
}

export default PlayerSelectScreen
