import { FunctionComponent, ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { textStyle } from '../style/tokens'

const ResourceBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[5]};
  border-radius: ${(props) => props.theme.radius.lg};
  background-color: ${(props) => props.theme.colors.secondary};
`

const ResourceRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${(props) => props.theme.space[3]};
`

const ResourceBarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  min-width: 0;
`

const RowLabel = styled(Label)`
  grid-column: 1 / -1;
`

// Layout constants (DESIGN.md 1.3)
const RESOURCE_HEIGHT = '64px'
const SLOT_WIDTH = '8px'
const SLOT_HEIGHT = '24px'

type ResourceVariant = 'action' | 'bonus' | 'movement' | 'spell' | 'special'

const Resource = styled.button<{ $variant: ResourceVariant }>`
  height: ${RESOURCE_HEIGHT};
  display: flex;
  align-items: center;
  justify-content: ${(props) => props.$variant === 'spell' ? 'space-between' : 'center'};
  gap: ${(props) => props.theme.space[3]};
  padding: ${(props) => props.$variant === 'spell' ? `0 ${props.theme.space[4]}` : '0'};
  font: inherit;
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  color: ${(props) => props.theme.colors.text.color};
  border: ${(props) => props.theme.borderWidth.thick} solid ${(props) => props.theme.colors.resource[props.$variant].strong};
  border-radius: ${(props) => props.theme.radius.md};
  background-color: ${(props) => props.theme.colors.resource[props.$variant].muted};
  cursor: ${(props) => props.$variant === 'movement' ? 'default' : 'pointer'};
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
  fill: ${(props) => props.$action > 0 ? props.theme.colors.resource.action.strong : props.theme.colors.resource.empty};
`

const BonusIcon = styled.polygon<{ $bonusAction: number }>`
  fill: ${(props) => props.$bonusAction > 0 ? props.theme.colors.resource.bonus.strong : props.theme.colors.resource.empty};
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

const Slot = styled.span<{ $variant: 'spell' | 'special'; $currentSlots: number; $id: number }>`
  width: ${SLOT_WIDTH};
  height: ${SLOT_HEIGHT};
  border-radius: ${(props) => props.theme.radius.sm};
  background-color: ${(props) => props.$currentSlots < props.$id ? props.theme.colors.resource.empty : props.theme.colors.resource[props.$variant].strong};
`

const ResourceBarPlayer: FunctionComponent = (): ReactElement => {

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
    
      const ActionHandler = (ressouce: number, setRessouce: React.Dispatch<React.SetStateAction<number>>) => {
        if(ressouce === 0) {
          setRessouce(1)
        }
        else {
          setRessouce(0)
        }
      }
    
      const SpellHandler = (ressouce: number, setRessouce: React.Dispatch<React.SetStateAction<number>>, maxRessource: number) => {
        if(ressouce === 0) {
          setRessouce(maxRessource)
        }
        else {
          setRessouce(ressouce - 1)
        }
      }
    
      const spellData = [
        { spell: spell1, setSpell: setSpell1, tier: 1, name: 'I', max: 4 },
        { spell: spell2, setSpell: setSpell2, tier: 2, name: 'II', max: 4 },
        { spell: spell3, setSpell: setSpell3, tier: 3, name: 'III', max: 3 },
        { spell: spell4, setSpell: setSpell4, tier: 4, name: 'IV', max: 2 },
      ]

    return(
        <ResourceBar>
            <ResourceRow>
                <ResourceBarSection>
                    <Label>Aktion</Label>
                    <Resource type='button' $variant='action' onClick={() => ActionHandler(action, setAction)}>
                        <IconSection>
                            <ResourceIcon viewBox='0 0 20 20'>
                                <ActionIcon cx='10' cy='10' r='10' $action={action} />
                            </ResourceIcon>
                        </IconSection>
                        <span>{action}</span>
                    </Resource>
                </ResourceBarSection>

                <ResourceBarSection>
                    <Label>Bonusaktion</Label>
                    <Resource type='button' $variant='bonus' onClick={() => ActionHandler(bonusAction, setBonusAction)}>
                        <IconSection>
                            <ResourceIcon viewBox='0 0 20 20'>
                                <BonusIcon points='10,1 20,19 0,19' $bonusAction={bonusAction} />
                            </ResourceIcon>
                        </IconSection>
                        <span>{bonusAction}</span>
                    </Resource>
                </ResourceBarSection>

                <ResourceBarSection>
                    <Label>Bewegung</Label>
                    <Resource as='div' $variant='movement'>
                        <IconSection>
                            <MovementIcon />
                            <MovementIcon />
                        </IconSection>
                        <span>9.5</span>
                    </Resource>
                </ResourceBarSection>

                <ResourceBarSection>
                    <Label>Spezial</Label>
                    <Resource type='button' $variant='special' onClick={() => SpellHandler(special, setSpecial, specialMax)}>
                        <SlotGroup>
                            {[...Array(3)].map((_, i) => (
                                <Slot key={i} $variant='special' $currentSlots={special} $id={i+1} />
                            ))}
                        </SlotGroup>
                    </Resource>
                </ResourceBarSection>
            </ResourceRow>

            <ResourceRow>
                <RowLabel>Zauberplätze</RowLabel>
                {spellData.map(({ spell, setSpell, tier, name }) => (
                    <Resource type='button' $variant='spell' key={tier} onClick={() => SpellHandler(spell, setSpell, SpellMax[tier])}>
                        <Numeral>{name}</Numeral>
                        <SlotGroup>
                            {[...Array(SpellMax[tier])].map((_, i) => (
                                <Slot key={i} $variant='spell' $currentSlots={spell} $id={i+1} />
                            ))}
                        </SlotGroup>
                    </Resource>
                ))}
            </ResourceRow>
        </ResourceBar>
    )
}

export { ResourceBarPlayer }
