import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { MapElement } from './MapElement'
import { ActiveMapContext } from '../context/context'
import { Map } from '../models/models'


const TILE_WIDTH = '96px'

const ContainerSideMaps = styled.div`
    height: auto;
    width: auto;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: ${(props) => props.theme.space[2]};
`

const SideMapsLabel = styled(Label)`
    margin-right: ${(props) => props.theme.space[2]};
`

const SideMapTile = styled.div`
    width: ${TILE_WIDTH};
    flex-shrink: 0;
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
        <ContainerSideMaps>
            <SideMapsLabel>Szenen</SideMapsLabel>
            {[...Array(count)].map((_, mapIndex) => {
                if (maps) {
                    return (
                        <SideMapTile key={ maps[mapIndex].id }>
                            <MapElement 
                                activeMapId={ activeMapId }
                                src={ maps[mapIndex].source } 
                                handleSceneSelection={ handleSceneSelection } 
                                keyProp={ maps[mapIndex].id }
                                isMainMap={ false }
                                isActiveMainMap={ isActiveMainMap }
                                isAdminScreen={ true } 
                                >  
                            </MapElement>
                        </SideMapTile>
                    )
                }
                return null
            })}
        </ContainerSideMaps>
    )
}
export { SideMaps }