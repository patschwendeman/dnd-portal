import { FunctionComponent, ReactElement, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { MapOverview } from '../components/MapOverview'
import { ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getBattlemapsfiltered } from '../service/battlemaps'
import { getSceneDetails } from '../service/scenes'
import { getSceneByKey } from '../utils/utils'

const Screen = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
`

const MapContainer = styled.div<{$isVisible: boolean}>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    width: 1200px;
    height: 700px;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    background-color: #000000b6;
    border-radius: 10px;
`

const BackgroundImage = styled.img`
    width: 100%;
    z-index: 1;
    position: fixed;
`

const WallScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [activeScene, setActiveScene] = useState<SceneDetail>()
    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    const [sceneDetails, setSceneDetails] = useState<SceneDetail[]>([])
    const [isActiveMainMap, setIsActiveMainMap] = useState<boolean>(false)

    useEffect(() => {
        getSceneDetails(setSceneDetails)
    }, [])
    
    useEffect(() => {
        getBattlemapsfiltered(setBattlemaps, { players: true })
    }, [activeSceneId])

    useEffect(() => {
        if (sceneDetails.length > 0) {
            const activeScene = getSceneByKey('id', activeSceneId, sceneDetails)
            setActiveScene(activeScene)
            if(activeScene.fight === true) {
                if (!activeScene.battlemaps_id) {
                    throw new Error('active Scene not found')
                }
                if(activeScene.battlemaps_id) {
                    setIsActiveMainMap(true)
                }
            }
            else {
                setIsActiveMainMap(false)
            }           
        }
    }, [activeSceneId, sceneDetails])

    return(
        <Screen>
            <BackgroundImage data-test-id='wallImg' src={activeScene?.graphics_wall.source} alt='' /> 
            <MapContainer $isVisible={isActiveMainMap}> 
                <MapOverview battlemaps={battlemaps} gap='10px' isActiveMainMap={ isActiveMainMap }/>
            </MapContainer>
        </Screen>       
    )
}
export { WallScreen }