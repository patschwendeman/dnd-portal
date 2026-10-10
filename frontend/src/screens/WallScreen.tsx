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
import { loadLatest } from '../utils/loadSafely'
import { getGridLayout } from '../utils/utils'
import MapEnvironmentSrc from './../../public/assets/images/ground_screen/mapOverview.jpg'


const OVERLAY_PANEL_MAX_WIDTH = '1440px'

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
// converted into a width, so the grid of battle maps (16:9 tiles, columns x rows) fits above the control bar.
// Without maps there is no grid, so the height limit is left out.
const OverlayPanel = styled.div<{ $isVisible: boolean, $columns: number, $rows: number }>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    flex-direction: column;
    align-items: stretch;
    width: min(
        ${OVERLAY_PANEL_MAX_WIDTH},
        calc(100vw - 2 * ${(props) => props.theme.space[8]})
        ${(props) => props.$rows > 0 ? `,
        calc(
            (100vh - ${props.theme.space[7]} - ${CONTROL_BAR_CLEARANCE} - 2 * ${props.theme.space[6]}
                - ${props.theme.text.xl.lineHeight} - ${props.theme.space[5]}
                - ${props.$rows - 1} * ${props.theme.space[3]}) * 16 / 9 * ${props.$columns} / ${props.$rows}
            + ${props.$columns - 1} * ${props.theme.space[3]} + 2 * ${props.theme.space[6]}
        )` : ''}
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

    const { columns, rows } = getGridLayout(mainmaps.length)

    const buttonLabels = ['BATTLE', 'WORLD', 'OFF']
    const activeButton = mainMapsVisibility ? 0 : worldMapVisibility ? 1 : 2

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

    useEffect(() => {
        let stale = false

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

        // Players see no error: the screen keeps the last loaded scene, the next scene change loads again.
        loadLatest(
            () => getWallScreenData(activeSceneId),
            ([activeScene, mainmaps]) => handleWallScreenData(activeScene, mainmaps),
            (err) => console.error('Error fetching wall data:', err),
            () => stale
        )

        // A scene switched before its data arrived must not overwrite the newly selected scene.
        return () => {
            stale = true
        }
    }, [activeSceneId])

    return(
        <Screen>
            <GlobalStyle />
            <BackgroundImage data-test-id='wallImg' src={activeScene?.graphics_wall.source} alt='' /> 
            <OverlayPanel $isVisible={mainMapsVisibility} $columns={columns} $rows={rows}>
                <PanelHeader>
                    <PanelTitle>Kampfschauplätze</PanelTitle>
                    <Label>{ mainmaps.length } Räume</Label>
                </PanelHeader>
                <MapOverview mainmaps={mainmaps} gap={theme.space[3]} padding='0' isAdminScreen={ false }/>
            </OverlayPanel>
            <OverlayPanel $isVisible={worldMapVisibility} $columns={columns} $rows={rows}>
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