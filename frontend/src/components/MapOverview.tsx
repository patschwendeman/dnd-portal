import React,{ FunctionComponent, ReactElement } from "react";
import { MapElement } from './MapElement'
import styled from 'styled-components';
import { Battlemap, BattlemapLight } from "../models/models";


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

interface MapOverviewProps {
    gap: string,
    src: string,
    battlemaps: Battlemap[] | BattlemapLight[]
    handleSceneSelection?(id: number): number
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({battlemaps, gap, src, handleSceneSelection }): ReactElement => {
      
      const count = Math.sqrt(battlemaps.length);
      
      return (
        <ContainerBattlemaps style={{ gap: gap }}>
            {[...Array(count)].map((_, colIndex) => (
                <BattlemapsColumn style={{ gap: gap }} key={colIndex}>
                    {[...Array(count)].map((_, mapIndex) => {
                        const itemIndex = colIndex * count + mapIndex;
                        if (itemIndex < battlemaps.length) {
                            return (
                                <MapElement 
                                    src={src} 
                                    handleSceneSelection={handleSceneSelection} 
                                    key={battlemaps[itemIndex].id}
                                    keyProp={battlemaps[itemIndex].id}>    
                                </MapElement>
                            );
                        }
                        return null;
                    })}
                </BattlemapsColumn>
            ))}
        </ContainerBattlemaps>
    );
}
export { MapOverview }