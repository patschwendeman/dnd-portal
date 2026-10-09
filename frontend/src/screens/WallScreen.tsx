import { FunctionComponent, ReactElement, useContext, useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components'

import { Label } from '../components/Label'
import { MapOverview } from '../components/MapOverview'
import { CONTROL_BAR_CLEARANCE, ScreenControlBar } from '../components/ScreenControlBar'
import { ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getWallScreenData } from '../service/WallScreen'
import { GlobalStyle } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import MapEnvironmentSrc from './../../public/assets/images/ground_screen/mapOverview.jpg'


const OVERLAY_PANEL_MAX_WIDTH = '1440px'
// Number of gaps per row/column in the 5 x 5 grid of battle maps
const GRID_GAP_COUNT = 4

const MapEnvironment = styled.img`
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    border-radius: ${(props) => props.theme.radius.md};
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
    align-items: flex-start;
    justify-content: center;
    padding-top: ${(props) => props.theme.space[7]};
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

// Width: smallest of the upper limit, the viewport minus the side margins and the available height
// converted into a width, so the 5 x 5 grid fits above the control bar
const OverlayPanel = styled.div<{$isVisible: boolean}>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    flex-direction: column;
    align-items: stretch;
    width: min(
        ${OVERLAY_PANEL_MAX_WIDTH},
        calc(100vw - 2 * ${(props) => props.theme.space[8]}),
        calc(
            (100vh - ${(props) => props.theme.space[7]} - ${CONTROL_BAR_CLEARANCE} - 2 * ${(props) => props.theme.space[6]}
                - ${(props) => props.theme.text.xl.lineHeight} - ${(props) => props.theme.space[5]}
                - ${GRID_GAP_COUNT} * ${(props) => props.theme.space[3]}) * 16 / 9
            + ${GRID_GAP_COUNT} * ${(props) => props.theme.space[3]} + 2 * ${(props) => props.theme.space[6]}
        )
    );
    height: auto;
    padding: ${(props) => props.theme.space[6]};
    z-index: ${(props) => props.theme.layer.panel};
    background-color: ${(props) => props.theme.colors.background};
    border-radius: ${(props) => props.theme.radius.lg};
`

const PanelHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: ${(props) => props.theme.space[5]};
`

const PanelTitle = styled.h2`
    ${textStyle('xl')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const BackgroundImage = styled.img`
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: ${(props) => props.theme.layer.media};
`
const WallScreen: FunctionComponent = (): ReactElement => {
    const theme = useTheme()
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [activeScene, setActiveScene] = useState<SceneDetail>()
    const [mainmaps, setMainmaps] = useState<Map[]>([])
    const [isActiveMainMap, setIsActiveMainMap] = useState<boolean>(false) 
    const [worldMapVisibility, setWorldMapVisibility] = useState<boolean>(false)
    const [mainMapsVisibility, setMainMapsVisibility] = useState<boolean>(isActiveMainMap)

    const buttonLabels = ['BATTLE', 'WORLD', 'OFF']
    const activeButton = mainMapsVisibility ? 0 : worldMapVisibility ? 1 : 2

    const handleWallScreenData = (activeScene: SceneDetail, mainmaps: Map[]) => {
        setActiveScene(activeScene)
        setMainmaps(mainmaps)
        setWorldMapVisibility(false)
        if(activeScene.main === true) {
            setIsActiveMainMap(true)
            setMainMapsVisibility(true)
        }
        else {
            setIsActiveMainMap(false)
            setMainMapsVisibility(false)
        }
    }

    function handleMapsVisibility(option: number) {
        if (option === 0) {
            setMainMapsVisibility(true)
            setWorldMapVisibility(false)
        } else if (option === 1) {
            setMainMapsVisibility(false)
            setWorldMapVisibility(true)
        } else {
            setMainMapsVisibility(false)
            setWorldMapVisibility(false)
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
            <GlobalStyle />
            <BackgroundImage data-test-id='wallImg' src={activeScene?.graphics_wall.source} alt='' /> 
            <OverlayPanel $isVisible={mainMapsVisibility}>
                <PanelHeader>
                    <PanelTitle>Kampfschauplätze</PanelTitle>
                    <Label>{ mainmaps.length } Räume</Label>
                </PanelHeader>
                <MapOverview mainmaps={mainmaps} gap={theme.space[3]} padding='0' isActiveMainMap={ isActiveMainMap } isAdminScreen={ false }/>
            </OverlayPanel>
            <OverlayPanel $isVisible={worldMapVisibility}>
                <PanelHeader>
                    <PanelTitle>Weltkarte</PanelTitle>
                </PanelHeader>
                <MapEnvironment src={MapEnvironmentSrc} ></MapEnvironment>
            </OverlayPanel>
            <ScreenControlBar onVisibilityChange={handleMapsVisibility} buttonLabels={buttonLabels} activeIndex={activeButton}/>
        </Screen>       
    )
}
export { WallScreen }