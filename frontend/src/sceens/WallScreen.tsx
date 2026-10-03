import { FunctionComponent, ReactElement, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { MapOverview } from '../components/MapOverview'
import { ScreenControlBar } from '../components/ScreenControlBar'
import { ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getWallScreenData } from '../service/WallScreen'
import MapEnvironmentSrc from './../../public/assets/images/ground_screen/mapOverview.jpg'


const MapEnvironment = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain;
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

const MapContainer = styled.div<{$isVisible: boolean}>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    width: 1200px;
    height: 700px;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    background-color: ${(props) => props.theme.colors.background};
    border-radius: 10px;
`

const BackgroundImage = styled.img`
    width: 100%;
    height: 100%;
    z-index: 1;
    position: fixed;
`
const WallScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [activeScene, setActiveScene] = useState<SceneDetail>()
    const [mainmaps, setMainmaps] = useState<Map[]>([])
    const [isActiveMainMap, setIsActiveMainMap] = useState<boolean>(false) 
    const [worldMapVisiblity, setWorldMapVisiblity] = useState<boolean>(false)
    const [mainMapsVisiblity, setMainMapsVisiblity] = useState<boolean>(isActiveMainMap)
    const [,setActiveButton] = useState<number | null>(null)

    const buttonLabels = ['BATTLE', 'WORLD', 'OFF']

    const handleWallScreenData = (activeScene: SceneDetail, mainmaps: Map[]) => {
        setActiveScene(activeScene)
        setMainmaps(mainmaps)
        setWorldMapVisiblity(false)
        if(activeScene.main === true) {
            setIsActiveMainMap(true)
            setMainMapsVisiblity(true)
        }
        else {
            setIsActiveMainMap(false)
            setMainMapsVisiblity(false)
        }
    }

    function handleMapsVisibility(option: number) {
        setActiveButton(option)
        if (option === 0) {
            setMainMapsVisiblity(true)
            setWorldMapVisiblity(false)
        } else if (option === 1) {
            setMainMapsVisiblity(false)
            setWorldMapVisiblity(true)
        } else {
            setMainMapsVisiblity(false)
            setWorldMapVisiblity(false)
        }
    }

    const fetchWallScreenData = async () => {
        try {
            const [activeScene, mainmaps] = await getWallScreenData(activeSceneId)
            handleWallScreenData(activeScene, mainmaps)
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
                <MapOverview mainmaps={mainmaps} gap='10px' isActiveMainMap={ isActiveMainMap } isAdminScreen={ false }/>
            </MapContainer>
            <MapContainer $isVisible={worldMapVisiblity}> 
            <MapEnvironment src={MapEnvironmentSrc} ></MapEnvironment>
            </MapContainer>
            <ScreenControlBar onVisibilityChange={handleMapsVisibility} buttonLabels={buttonLabels}/>
        </Screen>       
    )
}
export { WallScreen }