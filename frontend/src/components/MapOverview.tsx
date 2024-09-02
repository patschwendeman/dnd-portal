import React from 'react'
import { FunctionComponent, ReactElement } from "react";
import { MapElement } from './MapElement'
import styled from 'styled-components';


interface MapOverviewProps {
    gap: string,
    src: string
}

const ContainerBattlemaps = styled.div`
    display: flex;
    width: 100%;
    gap: 2px;
    position: relative;
    flex-wrap: wrap; 
    padding: 30px 10px 30px 10px;
`;

const BattlemapsColumn = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 2px;
`;

const MapOverview: FunctionComponent<MapOverviewProps> = ({ gap, src }): ReactElement => {
    return(
            <ContainerBattlemaps  style={{ gap: gap }}>
                <BattlemapsColumn style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </BattlemapsColumn>
                <BattlemapsColumn style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </BattlemapsColumn>
                <BattlemapsColumn style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </BattlemapsColumn>
                <BattlemapsColumn style={{ gap: gap }}>
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                    <MapElement src={ src } />
                </BattlemapsColumn>
            </ContainerBattlemaps>
    )
}
export { MapOverview }