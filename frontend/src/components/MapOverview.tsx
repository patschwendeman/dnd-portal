import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { MapElement } from './MapElement'
import { Map } from '../models/models'

const ContainerBattlemaps = styled.div`
    display: flex;
    width: 100%;
    gap: 2px;
    position: relative;
    flex-wrap: wrap; 
    padding: 30px 10px 30px 10px;
`

const BattlemapsColumn = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 2px;
`

interface MapOverviewProps {
    gap: string,
    battlemaps: Map[] | undefined
    handleSceneSelection?(id: number): number
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({battlemaps, gap, handleSceneSelection }): ReactElement => {

    let maps: Map[] = Array.from({ length: 16 }, (_, index) => ({
        id: index + 1    
    }))

    if(battlemaps)  {
        maps = battlemaps
    }
     
    const count = Math.sqrt(maps.length)
      
      return (
        <ContainerBattlemaps style={{ gap: gap }}>
            {[...Array(count)].map((_, colIndex) => (
                <BattlemapsColumn style={{ gap: gap }} key={colIndex}>
                    {[...Array(count)].map((_, mapIndex) => {
                        const itemIndex = colIndex * count + mapIndex
                        if (maps && itemIndex < maps.length) {
                            return (
                                <MapElement 
                                    src={maps[itemIndex].source} 
                                    handleSceneSelection={handleSceneSelection} 
                                    key={maps[itemIndex].id}
                                    keyProp={maps[itemIndex].id}>    
                                </MapElement>
                            )
                        }
                        return null
                    })}
                </BattlemapsColumn>
            ))}
        </ContainerBattlemaps>
    )
}
export { MapOverview }