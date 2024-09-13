import { FunctionComponent, ReactElement, useContext, useEffect } from 'react'
import styled from 'styled-components'

import { MapElement } from './MapElement'
import { ActiveMapContext } from '../context/context'
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
    handleSceneSelection?(id: number): void
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({ battlemaps, gap, handleSceneSelection }): ReactElement => {

    const { activeMapId } = useContext(ActiveMapContext)
    let maps: Map[]

    if(!battlemaps)  {
        maps = Array.from({ length: 16 }, (_, index) => ({
            id: index + 1    
        }))
    } 
    else {
        maps = battlemaps
    }
     
    const count = Math.sqrt(maps.length)
      
      return (
        <ContainerBattlemaps data-test-id='container-battlemaps' style={{ gap: gap }}>
            {[...Array(count)].map((_, colIndex) => (
                <BattlemapsColumn style={{ gap: gap }} key={ colIndex }>
                    {[...Array(count)].map((_, mapIndex) => {
                        const itemIndex = colIndex * count + mapIndex
                        if (maps && itemIndex < maps.length) {
                            return (
                                <MapElement 
                                    activeMapId={ activeMapId }
                                    src={ maps[itemIndex].source } 
                                    handleSceneSelection={ handleSceneSelection } 
                                    key={ maps[itemIndex].id }
                                    keyProp={ maps[itemIndex].id }
                                    isMainMap={ true }
                                    >    
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