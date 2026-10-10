import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { GridOverlay } from '../components/GridOverlay'
import { ScreenControlBar } from '../components/ScreenControlBar'
import { ActiveSceneContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { getGroundScreenData } from '../service/groundScreen'
import { GlobalStyle } from '../style/GlobalStyle'
import { loadLatest } from '../utils/loadSafely'


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
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

const BackgroundMedia = styled.video`
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: ${(props) => props.theme.layer.media};
`

const determineMediaType = (src: string): 'image' | 'video' | null => {
    const imageExtensions = ['.jpg', '.jpeg', '.png']
    const videoExtensions = ['.mp4', '.webm', '.mkv']

    const lowerSrc = src.toLowerCase()

    if (videoExtensions.some(ext => lowerSrc.endsWith(ext))) {
        return 'video'
    }
    if (imageExtensions.some(ext => lowerSrc.endsWith(ext))) {
        return 'image'
    }
    return null
}

const GroundScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [mediaSRC, setMediaSRC] = useState<string>('')
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
    const [gridColor, setGridColor] = useState<string>('')
    const [gridOption, setGridOption] = useState<number>(100)
    const [,setActiveButton] = useState<number | null>(null)

    const buttonLabels = ['BLACK', 'WHITE', 'OFF']

    const gridColorMap: Record<number, string> = {
        0: 'black',
        1: 'white',
        2: 'transparent',
    }

    const handleGridVisibility = (option: number) => {
        setActiveButton(option)
        setGridColor(gridColorMap[option] || 'transparent')
    }

    useEffect(() => {
        let stale = false

        const handleGroundScreen = (activeScene: SceneDetail) => {
            const src = activeScene.graphics_ground.source
            setMediaSRC(src)
            setMediaType(determineMediaType(src))
        }

        // Players see no error: the screen keeps the last loaded scene, the next scene change loads again.
        loadLatest(
            () => getGroundScreenData(activeSceneId),
            handleGroundScreen,
            (err) => console.error('Error fetching ground data:', err),
            () => stale
        )

        return () => {
            stale = true
        }
    }, [activeSceneId])

    return(
        <Screen>
            <GlobalStyle />
            <GridOverlay gridColor={gridColor} gridOption={gridOption} />
            {mediaType === 'image' && <BackgroundMedia as="img" data-test-id='groundImg' src={mediaSRC} alt="Background" />}
            {mediaType === 'video' && <BackgroundMedia data-test-id='groundImg' src={mediaSRC} autoPlay loop muted />}
            <ScreenControlBar onVisibilityChange={handleGridVisibility} onSliderChange={setGridOption} buttonLabels={buttonLabels} label='Raster' />
        </Screen> 
    )
}
export { GroundScreen }