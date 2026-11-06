import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'

// 4 × 2 buttons that fill the height the Player Screen gives the card; the names of the resources
// are only read out (aria-label), so the card fits into half the height of a phone held sideways
const ResourceBar = styled.section<TileSurfaceProps>`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: ${(props) => props.theme.space[3]};
  min-height: 0;
  padding: ${(props) => props.theme.space[4]};
  ${tileSurface}
`

const SLOT_WIDTH = '8px'
const SLOT_HEIGHT = '24px'

type ResourceVariant = 'action' | 'bonus' | 'movement' | 'spell' | 'special'

const Resource = styled.button<{ $variant: ResourceVariant }>`
  min-height: ${(props) => props.theme.size.control.lg};
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.$variant === 'spell' ? 'space-between' : 'center')};
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => (props.$variant === 'spell' ? `0 ${props.theme.space[4]}` : '0')};
  font: inherit;
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  color: ${(props) => props.theme.colors.text.color};
  border: ${(props) => props.theme.borderWidth.thick} solid
    ${(props) => props.theme.colors.resource[props.$variant].strong};
  border-radius: ${(props) => props.theme.radius.md};
  background-color: ${(props) => props.theme.colors.resource[props.$variant].muted};
  cursor: ${(props) => (props.$variant === 'movement' ? 'default' : 'pointer')};
`

const Numeral = styled.span`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const IconSection = styled.span`
  width: ${(props) => props.theme.size.icon};
  height: ${(props) => props.theme.size.icon};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[1]};
  flex: none;
`

const ResourceIcon = styled.svg`
  display: block;
  width: ${(props) => props.theme.size.icon};
  height: ${(props) => props.theme.size.icon};
`

const ActionIcon = styled.circle<{ $action: number }>`
  fill: ${(props) => (
    props.$action > 0
      ? props.theme.colors.resource.action.strong
      : props.theme.colors.resource.empty
  )};
`

const BonusIcon = styled.polygon<{ $bonusAction: number }>`
  fill: ${(props) => (
    props.$bonusAction > 0
      ? props.theme.colors.resource.bonus.strong
      : props.theme.colors.resource.empty
  )};
`

const MovementIcon = styled.span`
  width: ${(props) => props.theme.space[2]};
  height: ${(props) => props.theme.space[2]};
  border-radius: ${(props) => props.theme.radius.pill};
  background-color: ${(props) => props.theme.colors.resource.movement.strong};
`

const SlotGroup = styled.span`
  display: flex;
  gap: ${(props) => props.theme.space[1]};
`

const Slot = styled.span<{ $variant: 'spell' | 'special', $currentSlots: number, $id: number }>`
  width: ${SLOT_WIDTH};
  height: ${SLOT_HEIGHT};
  border-radius: ${(props) => props.theme.radius.sm};
  background-color: ${(props) => (
    props.$currentSlots < props.$id
      ? props.theme.colors.resource.empty
      : props.theme.colors.resource[props.$variant].strong
  )};
`

type SetResource = React.Dispatch<React.SetStateAction<number>>

// Numbers 1 … count of the slots of a resource
const slotNumbers = (count: number): number[] => (
  Array.from({ length: count }, (_, index) => index + 1)
)

interface ResourceBarPlayerProps {
  isTranslucent?: boolean
}

function ResourceBarPlayer({ isTranslucent = false }: ResourceBarPlayerProps): ReactElement {
  const SpellMax: Record<number, number> = {
    1: 4,
    2: 3,
    3: 3,
    4: 2,
  }
  const specialMax = 3

  const [action, setAction] = useState<number>(1)
  const [bonusAction, setBonusAction] = useState<number>(1)

  const [spell1, setSpell1] = useState<number>(SpellMax[1])
  const [spell2, setSpell2] = useState<number>(SpellMax[2])
  const [spell3, setSpell3] = useState<number>(SpellMax[3])
  const [spell4, setSpell4] = useState<number>(SpellMax[4])

  const [special, setSpecial] = useState<number>(1)

  const ActionHandler = (resource: number, setResource: SetResource) => {
    if (resource === 0) {
      setResource(1)
    } else {
      setResource(0)
    }
  }

  const SpellHandler = (resource: number, setResource: SetResource, maxResource: number) => {
    if (resource === 0) {
      setResource(maxResource)
    } else {
      setResource(resource - 1)
    }
  }

  const spellData = [
    {
      spell: spell1, setSpell: setSpell1, tier: 1, name: 'I', max: 4,
    },
    {
      spell: spell2, setSpell: setSpell2, tier: 2, name: 'II', max: 4,
    },
    {
      spell: spell3, setSpell: setSpell3, tier: 3, name: 'III', max: 3,
    },
    {
      spell: spell4, setSpell: setSpell4, tier: 4, name: 'IV', max: 2,
    },
  ]

  return (
    <ResourceBar aria-label="Ressourcen" data-test-id="resources" $isTranslucent={isTranslucent}>
      <Resource
        type="button"
        aria-label="Aktion"
        $variant="action"
        onClick={() => ActionHandler(action, setAction)}
      >
        <IconSection>
          <ResourceIcon viewBox="0 0 20 20">
            <ActionIcon cx="10" cy="10" r="10" $action={action} />
          </ResourceIcon>
        </IconSection>
        <span>{action}</span>
      </Resource>

      <Resource
        type="button"
        aria-label="Bonusaktion"
        $variant="bonus"
        onClick={() => ActionHandler(bonusAction, setBonusAction)}
      >
        <IconSection>
          <ResourceIcon viewBox="0 0 20 20">
            <BonusIcon points="10,1 20,19 0,19" $bonusAction={bonusAction} />
          </ResourceIcon>
        </IconSection>
        <span>{bonusAction}</span>
      </Resource>

      <Resource as="div" aria-label="Bewegung" $variant="movement">
        <IconSection>
          <MovementIcon />
          <MovementIcon />
        </IconSection>
        <span>9.5</span>
      </Resource>

      <Resource
        type="button"
        aria-label="Spezial"
        $variant="special"
        onClick={() => SpellHandler(special, setSpecial, specialMax)}
      >
        <SlotGroup>
          {slotNumbers(3).map((slot) => (
            <Slot key={slot} $variant="special" $currentSlots={special} $id={slot} />
          ))}
        </SlotGroup>
      </Resource>

      {spellData.map(({
        spell, setSpell, tier, name,
      }) => (
        <Resource
          type="button"
          aria-label={`Zauberplätze ${name}`}
          $variant="spell"
          key={tier}
          onClick={() => SpellHandler(spell, setSpell, SpellMax[tier])}
        >
          <Numeral>{name}</Numeral>
          <SlotGroup>
            {slotNumbers(SpellMax[tier]).map((slot) => (
              <Slot key={slot} $variant="spell" $currentSlots={spell} $id={slot} />
            ))}
          </SlotGroup>
        </Resource>
      ))}
    </ResourceBar>
  )
}

export default ResourceBarPlayer
