import { FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Battlemap, SceneDetail } from '../models/models'

const BattleDetailsContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    top: 0;
    right: 0;
`
const BattleDetails = styled.div<{$isFightScene: boolean}>`
    width: 100%;
    height: 85%;
    display: ${({ $isFightScene }) => ($isFightScene ? 'flex' : 'none')};
    margin: 30px 10px 30px;
    background-color: #161b23;
    color: #F0F6FC;
    border-radius: 9px;
    padding: 20px;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`

const BattleDetailHeader = styled.div`
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
`
const BattleDetailContent = styled.div`
    width: 100%;
    height: 28%;
    display: flex;
    border-top: 1px solid #3d444db3;
`

const ContentContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;

`

interface BattleDetailsSideBarProps {
    activeScene: SceneDetail | undefined;
  }

const BattleDetailsSideBar: FunctionComponent<BattleDetailsSideBarProps> = ({ activeScene }): ReactElement => {
    const [activeBattleMap, setActiveBattleMap] = useState<Battlemap>()
    const [battleData, setBattleData] = useState<{ enemies: string[], loot: string[] }>({ enemies: [], loot: [] })

    const splitStringByComma = (input: string): string[] => {
        return input.split(',').map(str => str.trim())
    }

    const updateBattleData = (battlemap: Battlemap) => {
        const enemies = splitStringByComma(battlemap.enemies || 'NONE')
        const loot = splitStringByComma(battlemap.loot || 'NONE')
        setBattleData({ enemies, loot })
    }

    const handleBattleData = () => {
       if(activeScene?.battlemaps) {
        const selectedBattleMap = activeScene.battlemaps
        setActiveBattleMap(selectedBattleMap)
        updateBattleData(selectedBattleMap)
       }
        
    }

    useEffect(() => {  
        handleBattleData()
    }, [activeScene])

    return (
        <BattleDetailsContainer>
            <BattleDetails $isFightScene={!!activeScene?.fight}>
                <BattleDetailHeader>
                    <strong>{activeBattleMap?.name}</strong>
                </BattleDetailHeader>
                <BattleDetailContent>
                    <ContentContainer>
                        <p>Enemies:</p>
                    </ContentContainer>
                    <ContentContainer>
                        <ul>
                            {battleData.enemies.map((enemy, index) => (
                                <li key={index}>{enemy}</li>
                            ))}
                        </ul>
                    </ContentContainer>
                </BattleDetailContent>
                <BattleDetailContent>
                    <ContentContainer>
                        <p>Loot:</p>
                    </ContentContainer>
                    <ContentContainer>
                        <ul>
                            <li>XP: {activeBattleMap?.xp}</li>
                            {battleData.loot.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </ContentContainer>
                </BattleDetailContent>
                <BattleDetailContent>
                    <ContentContainer>
                        <p>Notes:</p>
                    </ContentContainer>
                    <ContentContainer>
                        <p>{activeScene?.description || 'No notes available.'}</p>
                    </ContentContainer>
                </BattleDetailContent>

            </BattleDetails>
        </BattleDetailsContainer>
    )
}

export { BattleDetailsSideBar }
