import { FunctionComponent, ReactElement, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { MapOverview } from '../components/MapOverview'
import { ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getWallScreenData } from '../service/WallScreen'

const MapControl = styled.div`
    display: flex;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    width: 100%;
    height: 50px;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
    z-index: 99999 !important;
    font-family: "Poppins", sans-serif;
`

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

    &:hover ${MapControl} {
    opacity: 1;
    visibility: visible;
  }
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


const Button = styled.button`
    margin: 0 10px 0 10px; 
    width: 120px;
    height: 40px;
    cursor: pointer;
    border-radius: 6px;
    border: none;

    &:hover {
        background-color: #000000b6;
        color: white;
    }
`

const WallScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [activeScene, setActiveScene] = useState<SceneDetail>()
    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    const [isActiveMainMap, setIsActiveMainMap] = useState<boolean>(false) 
    const [worldMapVisiblity, setWorldMapVisiblity] = useState<boolean>(false)
    const [mainMapsVisiblity, setMainMapsVisiblity] = useState<boolean>(isActiveMainMap)

    const handleWallScreenData = (activeScene: SceneDetail, battlemaps: Map[]) => {
        setActiveScene(activeScene)
        setBattlemaps(battlemaps)
        setWorldMapVisiblity(false)
        if(activeScene.fight === true) {
            setIsActiveMainMap(true)
            setMainMapsVisiblity(true)
        }
        else {
            setIsActiveMainMap(false)
            setMainMapsVisiblity(false)
        }
    }

    function handleMapsVisibility(option: number) {
        if (option === 1) {
            setMainMapsVisiblity(true)
            setWorldMapVisiblity(false)
        } else if (option === 2) {
            setMainMapsVisiblity(false)
            setWorldMapVisiblity(true)
        } else {
            setMainMapsVisiblity(false)
            setWorldMapVisiblity(false)
        }
    }

    const fetchWallScreenData = async () => {
        try {
            const [activeScene, battlemaps] = await getWallScreenData(activeSceneId)
            handleWallScreenData(activeScene, battlemaps)
        } catch (err) {
            throw new Error(`Error fetching wall data: ${err}`)
        }
    }

    useEffect(() => {
        fetchWallScreenData()
    }, [activeSceneId])

    return(
        <Screen>
            <BackgroundImage data-test-id='wallImg' src={activeScene?.graphics_wall.source} alt='' /> 
            <MapContainer $isVisible={mainMapsVisiblity}> 
                <MapOverview battlemaps={battlemaps} gap='10px' isActiveMainMap={ isActiveMainMap }/>
            </MapContainer>
            <MapContainer $isVisible={worldMapVisiblity}> 
                <p>Hey</p>
            </MapContainer>
            <MapControl>
                <Button onClick={() => handleMapsVisibility(1)}>Map_1</Button> 
                <Button onClick={() => handleMapsVisibility(2)}>Map_2</Button> 
                <Button onClick={() => handleMapsVisibility(3)}>OFF</Button> 
            </MapControl>
        </Screen>       
    )
}
export { WallScreen }