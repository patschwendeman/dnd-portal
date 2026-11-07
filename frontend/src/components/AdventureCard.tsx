import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { css } from 'styled-components'

import CombatantAvatar from './CombatantAvatar'
import Label from './Label'
import { mediaUrl } from '../api/mediaUrl'
import { AdventureSummary } from '../models/models'
import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { NAMED_CARD_COUNT } from '../style/PageTransitionStyle'
import { textStyle } from '../style/tokens'
import { ADVENTURE_LOCKED_TITLE, partyPreview } from '../utils/adventureSelect'
import { characterInitials } from '../utils/player'

import imageIcon from '/assets/icons/image.svg'
import lockIcon from '/assets/icons/padlock.svg'

const PLACEHOLDER_ICON_SIZE = '40px'
// Faded like other locked controls, but still readable
const LOCKED_OPACITY = 0.5

interface CardProps extends TileSurfaceProps {
  $isActive: boolean
  $isLocked: boolean
}

// The whole card is the button, so everything inside is phrasing content (spans)
const Card = styled.button<CardProps>`
  ${tileSurface}
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 0;
  font: inherit;
  text-align: left;
  color: ${(props) => props.theme.colors.text.color};
  cursor: pointer;
  ${(props) => props.$isActive && css`
    border: ${props.theme.borderWidth.thick} solid ${props.theme.colors.primary};
  `}
  ${(props) => props.$isLocked && css`
    opacity: ${LOCKED_OPACITY};
    cursor: not-allowed;
  `}

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

const Picture = styled.span`
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.muted};

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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

// A chip on the image, so it reads on any image
const ImageLabel = styled(Label)`
  position: absolute;
  top: ${(props) => props.theme.space[3]};
  left: ${(props) => props.theme.space[3]};
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.theme.space[1]};
  padding: ${(props) => props.theme.space[1]} ${(props) => props.theme.space[2]};
  background-color: ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.radius.pill};
`

const ActiveLabel = styled(ImageLabel)`
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.onPrimary};
`

const Body = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.theme.space[4]};
`

const TitleRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[3]};
`

const Name = styled.span`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  min-width: 0;
  overflow-wrap: break-word;
  hyphens: auto;
`

const LevelBadge = styled.span`
  display: grid;
  flex: none;
  place-items: center;
  width: ${(props) => props.theme.size.badge};
  height: ${(props) => props.theme.size.badge};
  background-color: ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.onPrimary};
  border-radius: ${(props) => props.theme.radius.pill};
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  font-variant-numeric: tabular-nums;
`

// Not muted: text.muted on secondary misses 4.5:1 in Tavern
const Description = styled.span`
  ${textStyle('sm')}
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`

const Members = styled.span`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${(props) => props.theme.space[2]};
`

const Member = styled.span`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[2]};
  min-width: 0;
  padding: ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.md};
`

const MemberInfo = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const Ellipsis = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CharacterName = styled(Ellipsis)`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const PlayerName = styled(Ellipsis)`
  ${textStyle('xs')}
  color: ${(props) => props.theme.colors.text.muted};
`

const PartyNote = styled.span`
  ${textStyle('sm')}
`

interface CardIconProps {
  src: string
  size: string
}

function CardIcon({ src, size }: CardIconProps): ReactElement {
  return (
    <IconBox $size={size} aria-hidden="true">
      <ReactSVG src={src} />
    </IconBox>
  )
}

function Party({ adventure }: { adventure: AdventureSummary }): ReactElement {
  const { players } = adventure
  const { shown, hidden } = partyPreview(players)
  return (
    <>
      <Label data-test-id="adventure-card-party">{`Party · ${players.length}`}</Label>
      {players.length === 0 ? (
        <PartyNote data-test-id="adventure-card-no-party">Noch keine Charaktere</PartyNote>
      ) : (
        <Members>
          {shown.map((player) => (
            <Member key={player.id} data-test-id="adventure-card-member">
              <CombatantAvatar
                kind="player"
                text={characterInitials(player.character_name)}
                image={player.avatar}
                size="sm"
              />
              <MemberInfo>
                <CharacterName data-test-id="member-character" title={player.character_name}>
                  {player.character_name}
                </CharacterName>
                <PlayerName data-test-id="member-player" title={player.player_name}>
                  {player.player_name}
                </PlayerName>
              </MemberInfo>
            </Member>
          ))}
          {hidden > 0 && (
            <Member data-test-id="adventure-card-more">
              <PartyNote>{`+${hidden} weitere`}</PartyNote>
            </Member>
          )}
        </Members>
      )}
    </>
  )
}

interface AdventureCardProps {
  adventure: AdventureSummary
  isActive: boolean
  /** During a fight in another adventure: faded, with a lock on the image; a click does nothing */
  isLocked: boolean
  onSelect: (adventure: AdventureSummary) => void
  /** Place in the list; the cards sink away and rise in this order in the page transition */
  position: number
  /** The image is the shared image of the page transition to and from the Admin */
  isHero: boolean
}

/**
 * An adventure in the selection before the Admin: image, name, level, description and party; the
 * whole card is a button
 */
function AdventureCard({
  adventure, isActive, isLocked, onSelect, position, isHero,
}: AdventureCardProps): ReactElement {
  return (
    <Card
      type="button"
      lang="de"
      data-test-id={`adventure-card-${adventure.id}`}
      data-view-card={position < NAMED_CARD_COUNT ? position : undefined}
      data-active={isActive}
      data-locked={isLocked}
      // aria-disabled instead of disabled, so the tooltip shows and the card keeps its focus
      aria-disabled={isLocked || undefined}
      title={isLocked ? ADVENTURE_LOCKED_TITLE : undefined}
      onClick={() => {
        if (!isLocked) {
          onSelect(adventure)
        }
      }}
      $isActive={isActive}
      $isLocked={isLocked}
      $isTranslucent
    >
      <Picture>
        {adventure.image ? (
          <img
            src={mediaUrl(adventure.image.source)}
            alt=""
            data-test-id="adventure-card-image"
            data-view-hero={isHero || undefined}
          />
        ) : (
          <CardIcon src={imageIcon} size={PLACEHOLDER_ICON_SIZE} />
        )}
        {isActive && <ActiveLabel data-test-id="adventure-card-active">Aktiv</ActiveLabel>}
        {isLocked && (
          <ImageLabel data-test-id="adventure-card-lock">
            <CardIcon src={lockIcon} size="1em" />
            Gesperrt
          </ImageLabel>
        )}
      </Picture>
      <Body>
        <TitleRow>
          <Name data-test-id="adventure-card-name">{adventure.name}</Name>
          <LevelBadge data-test-id="adventure-card-level" title="Level">
            {adventure.global_level}
          </LevelBadge>
        </TitleRow>
        {adventure.description && (
          <Description data-test-id="adventure-card-description">
            {adventure.description}
          </Description>
        )}
        <Party adventure={adventure} />
      </Body>
    </Card>
  )
}

export default AdventureCard
