import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { MapElement } from './MapElement'
import { ActiveMapContext } from '../context/context'
import { Map } from '../models/models'

const ContainerMainmaps = styled.div`
    display: flex;
    width: 100%;
    gap: 2px;
    position: relative;
    flex-wrap: wrap; 
    padding: 30px 10px 30px 10px;
`

const MainmapsColumn = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: 2px;
`

interface MapOverviewProps {
    gap: string,
    mainmaps: Map[] | undefined
    handleSceneSelection?(id: number, isMainMap: boolean): void
    isActiveMainMap: boolean
    isAdminScreen: boolean
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({ mainmaps, gap, handleSceneSelection, isActiveMainMap, isAdminScreen }): ReactElement => {

    const { activeMapId } = useContext(ActiveMapContext)
    let maps: Map[]

    if(!mainmaps)  {
        maps = Array.from({ length: 16 }, (_, index) => ({
            id: index + 1    
        }))
    } 
    else {
        maps = mainmaps
    }
     
    const count = Math.sqrt(maps.length)
      
      return (
        <ContainerMainmaps data-test-id='container-mainmaps' style={{ gap: gap }}>
            {[...Array(count)].map((_, colIndex) => (
                <MainmapsColumn style={{ gap: gap }} key={ colIndex }>
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
                                    isActiveMainMap={ isActiveMainMap }
                                    isAdminScreen={ isAdminScreen }
                                    >    
                                </MapElement>
                            )
                        }
                        return null
                    })}
                </MainmapsColumn>
            ))}
        </ContainerMainmaps>
    )
}
export { MapOverview }