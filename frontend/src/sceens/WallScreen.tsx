import { FunctionComponent, ReactElement, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { MapOverview } from '../components/MapOverview'
import { ActiveSceneContext } from '../context/context'
import { Map } from '../models/models'
import { getBattlemapsfiltered } from '../service/battlemaps'

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

const MapContainer = styled.div`
    display: flex;
    width: 60%;
    height: 60%;
    align-items: center;
    justify-content: center;
    z-index: 99999;
`

const BackgroundImage = styled.img`
    width: 100%;
    z-index: 1;
    position: fixed;
`

const WallScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    
    useEffect(() => {
        getBattlemapsfiltered(setBattlemaps, { players: true })
    }, [])

    return(
        <Screen>
            <BackgroundImage src='/test.jpg' alt='' /> 
            <MapContainer> 
                <MapOverview battlemaps={battlemaps} gap='10px'/>
            </MapContainer>
        </Screen>       
    )
}
export { WallScreen }