import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { MapElement } from './MapElement'
import { ActiveMapContext } from '../context/context'
import { Map } from '../models/models'


const ContainerSideMaps = styled.div<{ $count: number }>`
    height: 75%;
    width: ${({ $count }) => ($count * 100)}px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px; 
`

interface SideMapsProps {
    sidemaps: Map[] | undefined
    handleSceneSelection?(id: number, isMainMap: boolean): void
    isActiveMainMap: boolean
}

const SideMaps: FunctionComponent<SideMapsProps> = ({ sidemaps , handleSceneSelection, isActiveMainMap }): ReactElement => {

    const { activeMapId } = useContext(ActiveMapContext)


    let maps: Map[]

    if(!sidemaps)  {
        maps = Array.from({ length: 4 }, (_, index) => ({
            id: index + 1    
        }))
    }
    else {
        maps = sidemaps
    }
    
    const count = maps.length
      
      return (
        <ContainerSideMaps $count={count}>
            {[...Array(count)].map((_, mapIndex) => {
                if (maps) {
                    return (
                        <MapElement 
                            activeMapId={ activeMapId }
                            src={ maps[mapIndex].source } 
                            handleSceneSelection={ handleSceneSelection } 
                            key={ maps[mapIndex].id }
                            keyProp={ maps[mapIndex].id }
                            isMainMap={ false }
                            isActiveMainMap={ isActiveMainMap }>    
                        </MapElement>
                    )
                }
                return null
            })}
        </ContainerSideMaps>
    )
}
export { SideMaps }