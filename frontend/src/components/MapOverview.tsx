import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { MapElement } from './MapElement'
import { ActiveSceneContext } from '../context/context'
import { Map } from '../models/models'
import { getGridLayout } from '../utils/utils'

// Grid instead of flex columns, so any number of maps fits; an incomplete last row stays left-aligned
const ContainerMainmaps = styled.div<{ $padding: string, $columns: number }>`
    display: grid;
    grid-template-columns: ${(props) => props.$columns > 0 ? `repeat(${props.$columns}, minmax(0, 1fr))` : 'none'};
    width: 100%;
    position: relative;
    padding: ${(props) => props.$padding};
`

interface MapOverviewProps {
    gap: string,
    padding: string,
    mainmaps: Map[] | undefined
    handleSceneSelection?(sceneId: number): void
    isAdminScreen: boolean
}

const MapOverview: FunctionComponent<MapOverviewProps> = ({ mainmaps, gap, padding, handleSceneSelection, isAdminScreen }): ReactElement => {

    const { activeSceneId } = useContext(ActiveSceneContext)
    let maps: Map[]

    if(!mainmaps)  {
        maps = Array.from({ length: 16 }, (_, index) => ({
            sceneId: index + 1    
        }))
    } 
    else {
        maps = mainmaps
    }
     
    const { columns } = getGridLayout(maps.length)

    return (
        <ContainerMainmaps data-test-id='container-mainmaps' $padding={padding} $columns={columns} style={{ gap: gap }}>
            {maps.map((map, itemIndex) => (
                <MapElement 
                    activeSceneId={ activeSceneId }
                    src={ map.source } 
                    handleSceneSelection={ handleSceneSelection } 
                    key={ map.sceneId }
                    sceneId={ map.sceneId }
                    number={ itemIndex + 1 }
                    isAdminScreen={ isAdminScreen }
                    >    
                </MapElement>
            ))}
        </ContainerMainmaps>
    )
}
export { MapOverview }