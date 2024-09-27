import { FunctionComponent, ReactElement, useState } from 'react'
import styled from 'styled-components'

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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
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

const SkillBar = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.secondary};
  border-bottom: 5px solid ${(props) => props.theme.colors.border};
  border-top: 5px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  padding-top: 10px;
  padding-bottom: 10px;
`

const SkillBarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Text = styled.div`
  width: 100%;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 10px;

  @media (max-width: 739px) {
    font-size: 16px !important;
  }
`

const SpellSkill = styled.div`
  width: 80px;
  height: 50px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  text-align: center;
  font-size: 30px;
  color: #9e998a;
  margin: 0 10px 0 10px;
  border: 2px #2487ff solid;
  background-color: #001229;
  cursor: pointer;
  @media (max-width: 739px) {
    margin: 0;
  }
  `

const Skill = styled.div<{ $variant: 'action' | 'bonus' | 'movement' | 'special' }>`
  width: 80px;
  height: 50px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  text-align: center;
  font-size: 30px;
  color: #9e998a;
  cursor: pointer;
  @media (max-width: 739px) {
    width: 70px !important;
    height: 40px !important;
    font-size: 25px !important;
  }

  ${(props) =>
    props.$variant === 'action' &&
    `
    border: 2px #077600 solid;
    background-color: #072900;
  `}

  ${(props) =>
    props.$variant === 'bonus' &&
    `
    border: 2px #b23700 solid;
    background-color: #290e00;
  `}

  ${(props) =>
    props.$variant === 'movement' &&
    `
    border: 2px #fae100 solid;
    background-color: #292500;
  `}



  ${(props) =>
    props.$variant === 'special' &&
    `
    border: 2px #ff2424 solid;
    background-color: #290000;
  `}
`

const IconSection = styled.div`
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ActionIcon = styled.div<{$action: number}>`
  width: 100%;
  height: 100%;
  background-color:  ${(props) => props.$action > 0 ? '#077600' : '#232321'};
  border-radius: 100px;
`

const BonusIcon = styled.div<{$bonusAction: number}>`
  width: 0;
  height: 0;
  -webkit-transform: rotate(360deg);
  border-style: solid;
  border-width: 0 12px 22px 12px;
  border-color: transparent transparent ${(props) => props.$bonusAction > 0 ? '#b23700' : '#232321'} transparent;
`

const MovementIcon = styled.div`
  width: 100%;
  height: 50%;
  background-color: #fae100;
  border-radius: 100px;
  margin-left: 2px;
`

const Slot = styled.div<{$currentSlots: number, $id: number}>`
  background-color:  ${(props) => props.$currentSlots < props.$id ? '#232321' : '#2487ff'};
  height: 23px;
  width: 10px;
  @media (max-width: 739px) {
    width: 7px;
  }
`

const SpecialSlot = styled.div<{ $currentSlots: number; $id: number }>`
  background-color: ${(props) => props.$currentSlots < props.$id ? '#232321' : '#ff2424'};
  height: 23px;
  width: 10px;
  @media (max-width: 739px) {
    width: 7px;
  }
`

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`

const DnDScreen: FunctionComponent = (): ReactElement => {

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
    { spell: spell4, setSpell: setSpell4, tier: 4, name: 'IV', max: 4 },
  ]

  return (
    <Background>
    <Overlay>
      <img src="assets/icons/refresh.png" alt="refresh" />
    </Overlay>
    <SkillBar>
      <SkillBarSection>
        <Text>Aktion</Text>
        <Skill $variant="action" onClick={() => ActionHandler(action, setAction)}>
          <IconSection>
            <ActionIcon $action={action} />
          </IconSection>
          <p>{action}</p>
        </Skill>
      </SkillBarSection>

      <SkillBarSection>
        <Text>Bonusaktion</Text>
        <Skill $variant="bonus" onClick={() => ActionHandler(bonusAction, setBonusAction)}>
          <IconSection>
            <BonusIcon $bonusAction={bonusAction} />
          </IconSection>
          <p>{bonusAction}</p>
        </Skill>
      </SkillBarSection>

      <SkillBarSection>
        <Text>Bewegung</Text>
        <Skill $variant="movement">
          <IconSection>
            <MovementIcon />
            <MovementIcon />
          </IconSection>
          <p>9.5</p>
        </Skill>
      </SkillBarSection>

      <SkillBarSection>
        <Text>Zauberplätze</Text>
        <FlexRow>
        {spellData.map(({ spell, setSpell, tier, name }) => (
              <SpellSkill key={tier} onClick={() => SpellHandler(spell, setSpell, SpellMax[tier])}>
                <p>{name}</p>
                {[...Array(SpellMax[tier])].map((_, i) => (
                  <Slot key={i} $currentSlots={spell} $id={i+1} />
                ))}
              </SpellSkill>
            ))}
          </FlexRow>
      </SkillBarSection>

      <SkillBarSection>
        <Text>Spezial</Text>
        <Skill $variant="special" onClick={() => SpellHandler(special, setSpecial, specialMax)}>
          {[...Array(3)].map((_, i) => (
            <SpecialSlot key={i} $currentSlots={special} $id={i+1}  />
          ))}
        </Skill>
      </SkillBarSection>
    </SkillBar>
  </Background>
  )
}

export { DnDScreen }
