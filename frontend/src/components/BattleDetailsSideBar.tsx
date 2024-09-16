import { FunctionComponent, ReactElement, useContext, useState } from 'react'
import styled from 'styled-components'

import { ActiveMapContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { getBattlemapById } from '../service/battlemaps'

const BattleDetailsContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    top: 0;
    right: 0;
`
const BattleDetails = styled.div`
    width: 100%;
    height: 85%;
    display: flex;
    margin: 30px 10px 30px;
    background-color: rgb(184, 184, 184);
    border-radius: 9px;
    padding: 10px;
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
    border-bottom: 3px solid black;
`
const BattleDetailContent = styled.div`
    width: 100%;
    height: 28%;
    display: flex;
    border-bottom: 1px solid black;
`

const ContentContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;

`



const BattleDetailsSideBar: FunctionComponent = (): ReactElement => {
    const { activeMapId } = useContext(ActiveMapContext)
    const [battlemap, setBattlemap] = useState()

    getBattlemapById(setBattlemap, activeMapId)




  return (
    <BattleDetailsContainer>
        <BattleDetails>
            <BattleDetailHeader>
                MAP 1
            </BattleDetailHeader>
            <BattleDetailContent>
                <ContentContainer>
                    <p>Enemies:</p>
                </ContentContainer>
                <ContentContainer>
                    <ul>
                        <li>Bandit</li>
                        <li>Bandit</li>
                        <li>Bandit</li>
                        <li>Bandit</li>
                        <li>Bandit</li>
                    </ul>
                </ContentContainer>
                
                
            </BattleDetailContent>
            <BattleDetailContent>
            <ContentContainer>
                    <p>Loot:</p>
                </ContentContainer>
                <ContentContainer>
                    <ul>
                        <li>200 xp</li>
                        <li>300 Gold</li>
                        <li>Sword</li>
                    </ul>
                </ContentContainer>
            </BattleDetailContent>
            <BattleDetailContent>
            <ContentContainer>
                    <p>Notes:</p>
                </ContentContainer>
                <ContentContainer>
                        <p>dasdas asdd dsa das asdad  asd da das ad  a das das das ads d s</p>
                </ContentContainer>
            </BattleDetailContent>

        </BattleDetails>
    </BattleDetailsContainer>
  )
}

export { BattleDetailsSideBar }
