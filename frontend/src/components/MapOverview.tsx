import React,{ FunctionComponent, ReactElement } from "react";
import { MapElement } from './MapElement'
import styled from 'styled-components';


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
    src: string
    handleSceneSelection?(id: number): number
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({ gap, src, handleSceneSelection }): ReactElement => {

    interface MockItem {
        id: number;
    }
    
    interface MockData {
        items: MockItem[];
    }

    const Mock: MockData  = {
        "items": [
          { "id": 1 },
          { "id": 2 },
          { "id": 3 },
          { "id": 4 },
          { "id": 5 },
          { "id": 6 },
          { "id": 7 },
          { "id": 8 },
          { "id": 9 },
          { "id": 10 },
          { "id": 11 },
          { "id": 12 },
          { "id": 13 },
          { "id": 14 },
          { "id": 15 },
          { "id": 16 }
        ]
      }
      
      const count = Math.sqrt(Mock.items.length);
      
      return (
        <ContainerBattlemaps style={{ gap: gap }}>
            {[...Array(count)].map((_, colIndex) => (
                <BattlemapsColumn style={{ gap: gap }} key={colIndex}>
                    {[...Array(count)].map((_, mapIndex) => {
                        const itemIndex = colIndex * count + mapIndex;
                        if (itemIndex < Mock.items.length) {
                            return (
                                <MapElement 
                                    src={src} 
                                    handleSceneSelection={handleSceneSelection} 
                                    key={Mock.items[itemIndex].id}
                                    keyProp={Mock.items[itemIndex].id}>    
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