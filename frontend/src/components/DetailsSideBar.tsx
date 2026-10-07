import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { SceneDetail } from '../models/models'
import { textStyle } from '../style/tokens'

const LABEL_COLUMN_WIDTH = '96px'

const Details = styled.div`
    width: 100%;
    height: auto;
    display: flex;
    margin: 0;
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: ${(props) => props.theme.radius.lg};
    padding: ${(props) => props.theme.space[5]};
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
`

const DetailHeader = styled.div`
    width: 100%;
    height: auto;
    display: block;
    text-align: left;
    ${textStyle('md')}
`

const SceneName = styled.strong`
    display: block;
    ${textStyle('lg')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const SceneDescription = styled.p`
    margin-top: ${(props) => props.theme.space[1]};
    ${textStyle('sm')}
`

const DetailRows = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: ${(props) => props.theme.space[5]};
`

const DetailContent = styled.div`
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: ${LABEL_COLUMN_WIDTH} 1fr;
    align-items: baseline;
    gap: ${(props) => props.theme.space[3]};
    padding: ${(props) => props.theme.space[3]} 0;
    border-top: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
    ${textStyle('sm')}
`

interface DetailsSideBarProps {
    activeScene: SceneDetail | undefined;
  }

const DetailsSideBar: FunctionComponent<DetailsSideBarProps> = ({ activeScene }): ReactElement => {

    return (
        <Details>
            <DetailHeader>
                <Label>Aktive Szene</Label>
                <SceneName>{activeScene?.name}</SceneName>
                <SceneDescription>{activeScene?.description}</SceneDescription>
            </DetailHeader>
            <DetailRows>
                <DetailContent>
                    <Label>Enemies</Label>
                    <span>–</span>
                </DetailContent>
                <DetailContent>
                    <Label>Loot</Label>
                    <span>–</span>
                </DetailContent>
            </DetailRows>
        </Details>
    )
}

export { DetailsSideBar }
