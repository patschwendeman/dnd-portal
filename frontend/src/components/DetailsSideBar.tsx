import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { SceneDetail } from '../models/models'

const DetailsContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    top: 0;
    right: 0;
`
const Details = styled.div`
    width: 100%;
    height: 220px;
    display: 'flex';
    margin: 17px 10px 10px;
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: 9px;
    padding: 20px;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`

const DetailHeader = styled.div`
    width: 100%;
    height: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
`
const DetailContent = styled.div`
    width: 100%;
    height: 40%;
    display: flex;
    border-top: 1px solid ${(props) => props.theme.colors.border};
`

const ContentContainer = styled.div`
    width: 50%;
    height: 100%;
    display: flex;

`

interface DetailsSideBarProps {
    activeScene: SceneDetail | undefined;
  }

const DetailsSideBar: FunctionComponent<DetailsSideBarProps> = ({ activeScene }): ReactElement => {

    return (
        <DetailsContainer>
            <Details>
                <DetailHeader>
                    <strong>{activeScene?.name}</strong>
                </DetailHeader>
                <DetailContent>
                    <ContentContainer>
                        <p>Enemies:</p>
                    </ContentContainer>
                    <ContentContainer>
                        <strong>{activeScene?.description}</strong>
                    </ContentContainer>
                </DetailContent>
                <DetailContent>
                    <ContentContainer>
                        <p>Loot:</p>
                    </ContentContainer>
                    <ContentContainer>

                    </ContentContainer>
                </DetailContent>
                

            </Details>
        </DetailsContainer>
    )
}

export { DetailsSideBar }