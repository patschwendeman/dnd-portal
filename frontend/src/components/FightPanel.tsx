import { KeyboardEvent, ReactElement, useState } from 'react'
import styled from 'styled-components'

import CombatantAvatar from './CombatantAvatar'
import Label from './Label'
import MiniButton from './MiniButton'
import OptionButtons from './OptionButtons'
import { TextButton } from './TextButton'
import { Player } from '../models/models'
import { textStyle } from '../style/tokens'
import {
  FightRow,
  NpcKind,
  combatantAvatarText,
  combatantDetails,
  combatantName,
  firstName,
  missingPlayers,
  numberError,
  smallestFreeNumber,
} from '../utils/fight'

import chevronDownIcon from '/assets/icons/chevronDown.svg'
import chevronUpIcon from '/assets/icons/chevronUp.svg'
import closeIcon from '/assets/icons/close.svg'

const AVATAR_COLUMN = '32px'
const NUMBER_FIELD_WIDTH = '64px'
// Out of the fight: still in the list, but faded
const DEFEATED_OPACITY = 0.5

const KIND_OPTIONS = [
  { value: 'enemy', label: 'Gegner' },
  { value: 'ally', label: 'Verbündeter' },
] as const

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  min-height: 100%;
`

const Head = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[2]};
  padding: 0 ${(props) => props.theme.space[1]};
`

const PanelLabel = styled(Label)`
  padding: 0 ${(props) => props.theme.space[1]};
`

const Hint = styled.p`
  padding: 0 ${(props) => props.theme.space[1]};
  ${textStyle('sm')}
`

const ErrorText = styled.p`
  padding: 0 ${(props) => props.theme.space[1]};
  ${textStyle('sm')}
  color: ${(props) => props.theme.colors.negative.text};
`

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  padding: 0;
  list-style: none;
`

const Row = styled.li<{ $isActive: boolean, $isDefeated: boolean }>`
  display: grid;
  grid-template-columns: ${AVATAR_COLUMN} minmax(0, 1fr) auto;
  gap: ${(props) => props.theme.space[2]};
  align-items: center;
  padding: ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.md};
  box-shadow: ${(props) => (props.$isActive
    ? `inset 0 0 0 ${props.theme.borderWidth.thick} ${props.theme.colors.primary}`
    : 'none')};
  opacity: ${(props) => (props.$isDefeated ? DEFEATED_OPACITY : 1)};
`

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

const RowName = styled.span`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const RowDetails = styled.span`
  ${textStyle('xs')}
  color: ${(props) => props.theme.colors.text.muted};
`

const Controls = styled.div`
  display: flex;
  align-items: center;
`

const MoveButtons = styled.div`
  display: flex;
  flex-direction: column;
`

const Divider = styled.div`
  height: ${(props) => props.theme.borderWidth.thin};
  background-color: ${(props) => props.theme.colors.border};
`

const AddFields = styled.div`
  display: grid;
  grid-template-columns: ${NUMBER_FIELD_WIDTH} minmax(0, 1fr);
  gap: ${(props) => props.theme.space[2]};
`

const Field = styled.input`
  width: 100%;
  min-width: 0;
  height: ${(props) => props.theme.size.control.md};
  padding: 0 ${(props) => props.theme.space[3]};
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.color};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.md};
  font-family: inherit;
  ${textStyle('sm')}

  &::placeholder {
    color: ${(props) => props.theme.colors.text.muted};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.space[1]};
`

const PlayerChip = styled.button`
  height: calc(${(props) => props.theme.size.control.md} - ${(props) => props.theme.space[2]});
  padding: 0 ${(props) => props.theme.space[3]};
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text.color};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  font-family: inherit;
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.onPrimary};
  }
`

const Foot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[2]};
  margin-top: auto;
  padding-top: ${(props) => props.theme.space[3]};

  button:disabled {
    opacity: ${DEFEATED_OPACITY};
    cursor: default;
  }
`

interface FightPanelProps {
  // Preparation (local) or the running fight, in initiative order
  rows: FightRow[]
  players: Player[]
  isFighting: boolean
  round: number | null
  activeKey: string | null
  canStart: boolean
  onMove: (index: number, step: -1 | 1) => void
  onRemove: (index: number) => void
  onAddNpc: (kind: NpcKind, number: number, label: string) => void
  onAddPlayer: (player: Player) => void
  onStart: () => void
  onEnd: () => void
}

// Content of the panel "Kampf": before the fight its preparation, during the fight its list;
// both in initiative order with move, remove and add
function FightPanel({
  rows, players, isFighting, round, activeKey, canStart,
  onMove, onRemove, onAddNpc, onAddPlayer, onStart, onEnd,
}: FightPanelProps): ReactElement {
  const [kind, setKind] = useState<NpcKind>('enemy')
  // null: the field shows the smallest free number
  const [numberInput, setNumberInput] = useState<string | null>(null)
  const [label, setLabel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const combatants = rows.map((row) => row.combatant)
  const suggested = smallestFreeNumber(combatants)
  const numberValue = numberInput ?? (suggested === null ? '' : String(suggested))
  const absentPlayers = missingPlayers(players, combatants)

  const add = () => {
    const rejection = numberError(numberValue, combatants)
    setError(rejection)
    if (rejection !== null) {
      return
    }
    onAddNpc(kind, Number(numberValue.trim()), label)
    setNumberInput(null)
    setLabel('')
  }

  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      add()
    }
  }

  return (
    <Panel data-test-id="fight-panel">
      <Head>
        <Label>{isFighting ? 'Kampf' : 'Kampf vorbereiten'}</Label>
        {isFighting && round !== null && (
          <Label data-test-id="fight-panel-round">{`Runde ${round}`}</Label>
        )}
      </Head>
      <Hint>Reihenfolge = Initiative</Hint>
      {rows.length === 0
        ? <Hint data-test-id="fight-empty">Noch keine Teilnehmer</Hint>
        : (
          <List data-test-id="fight-list">
            {rows.map((row, index) => {
              const name = combatantName(row.combatant, players)
              const details = combatantDetails(row.combatant, players)
              return (
                <Row
                  key={row.key}
                  lang="de"
                  data-test-id="fight-row"
                  data-active={row.key === activeKey}
                  $isActive={row.key === activeKey}
                  $isDefeated={row.combatant.defeated ?? false}
                >
                  <CombatantAvatar
                    kind={row.combatant.kind}
                    text={combatantAvatarText(row.combatant, players)}
                    image={players.find((p) => p.id === row.combatant.player_id)?.avatar ?? null}
                    size="sm"
                  />
                  <RowText>
                    <RowName data-test-id="combatant-name" title={name}>{name}</RowName>
                    {details && <RowDetails data-test-id="combatant-details">{details}</RowDetails>}
                  </RowText>
                  <Controls>
                    <MoveButtons>
                      <MiniButton
                        icon={chevronUpIcon}
                        name="Nach vorn"
                        isStacked
                        disabled={index === 0}
                        testId="move-up"
                        onClick={() => onMove(index, -1)}
                      />
                      <MiniButton
                        icon={chevronDownIcon}
                        name="Nach hinten"
                        isStacked
                        disabled={index === rows.length - 1}
                        testId="move-down"
                        onClick={() => onMove(index, 1)}
                      />
                    </MoveButtons>
                    <MiniButton
                      icon={closeIcon}
                      name="Entfernen"
                      testId="remove"
                      onClick={() => onRemove(index)}
                    />
                  </Controls>
                </Row>
              )
            })}
          </List>
        )}
      <Divider />
      <PanelLabel>{isFighting ? 'Verstärkung' : 'Hinzufügen'}</PanelLabel>
      <OptionButtons
        options={KIND_OPTIONS}
        value={kind}
        label="Art"
        testIdPrefix="add-kind"
        onChange={setKind}
      />
      <AddFields>
        <Field
          type="number"
          min={1}
          max={99}
          value={numberValue}
          title="Nummer der Figur"
          aria-label="Nummer der Figur"
          data-test-id="add-number"
          onChange={(event) => {
            setNumberInput(event.target.value)
            setError(null)
          }}
          onKeyDown={addOnEnter}
        />
        <Field
          type="text"
          value={label}
          placeholder="Bezeichnung"
          aria-label="Bezeichnung (nur im Admin sichtbar)"
          data-test-id="add-label"
          onChange={(event) => {
            setLabel(event.target.value)
            setError(null)
          }}
          onKeyDown={addOnEnter}
        />
      </AddFields>
      <Hint>Nummer = Figur am Tisch. Die Bezeichnung sieht nur der Spielleiter.</Hint>
      {error && <ErrorText role="alert" data-test-id="add-error">{error}</ErrorText>}
      <TextButton type="button" $variant="cancel" data-test-id="add-npc" onClick={add}>
        Hinzufügen
      </TextButton>
      {absentPlayers.length > 0 && (
        <Chips>
          {absentPlayers.map((player) => (
            <PlayerChip
              key={player.id}
              type="button"
              data-test-id={`add-player-${player.id}`}
              onClick={() => onAddPlayer(player)}
            >
              {`+ ${firstName(player)}`}
            </PlayerChip>
          ))}
        </Chips>
      )}
      <Foot>
        {isFighting
          ? (
            <TextButton type="button" $variant="cancel" data-test-id="end-fight" onClick={onEnd}>
              Kampf beenden
            </TextButton>
          )
          : (
            <TextButton
              type="button"
              $variant="active"
              disabled={!canStart}
              data-test-id="start-fight"
              onClick={onStart}
            >
              Kampf starten
            </TextButton>
          )}
      </Foot>
    </Panel>
  )
}

export default FightPanel
