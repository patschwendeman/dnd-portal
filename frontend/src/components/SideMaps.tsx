import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { MapElement } from './MapElement'
import { ActiveSceneContext } from '../context/context'
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
    handleSceneSelection?(sceneId: number): void
}

const SideMaps: FunctionComponent<SideMapsProps> = ({ sidemaps , handleSceneSelection }): ReactElement => {

    const { activeSceneId } = useContext(ActiveSceneContext)


    let maps: Map[]

    if(!sidemaps)  {
        maps = Array.from({ length: 4 }, (_, index) => ({
            sceneId: index + 1    
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
                        <SideMapTile key={ maps[mapIndex].sceneId }>
                            <MapElement 
                                activeSceneId={ activeSceneId }
                                src={ maps[mapIndex].source } 
                                handleSceneSelection={ handleSceneSelection } 
                                sceneId={ maps[mapIndex].sceneId }
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