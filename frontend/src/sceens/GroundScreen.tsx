import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { GridOverlay } from '../components/GridOverlay'
import { ScreenControlBar } from '../components/ScreenControlBar'
import { ActiveSceneContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { getGroundScreenData } from '../service/groundScreen'
import { getMediaSRC } from '../utils/utils'


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
    background-color: ${(props) => props.theme.colors.background};;
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

const BackgroundImage = styled.img`
    width: 100%;
    height: 100%;
    z-index: 1;
    position: fixed;
`

const GroundScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [imageSRC, setImageSRC] = useState<string>('')
    const [gritColor, setGritColor] = useState<string>('')
    const [,setActiveButton] = useState<number | null>(null)

    const buttonLabels = ['BLACK', 'WHITE', 'OFF']

    const handleGroundScreen = (activeScene: SceneDetail) => {
        let src
        if (activeScene.fight === true) {
            src = getMediaSRC(activeScene, 'battlemaps')
            
        } else {
            src = activeScene.graphics_ground.source
        }

        setImageSRC(src)
    }

    function handleGridVisibility(option: number) {
        setActiveButton(option)
        if (option === 0) {
            setGritColor('black')
        } else if (option === 1) {
            setGritColor('white')
        } else {
            setGritColor('transparent')
        }
    }

    const fetchGroundScreenData = async () => {
        try {
            const activeScene = await getGroundScreenData(activeSceneId)
            handleGroundScreen(activeScene) 
        } catch (err) {
            throw new Error(`Error fetching active scene data: ${err}`)
        }
    }

    useEffect(() => { 
        fetchGroundScreenData()
    }, [activeSceneId])

    return(
        <Screen>
            <GridOverlay gritColor={ gritColor } />
            <BackgroundImage data-test-id='groundImg' src={imageSRC} alt='' />
            <ScreenControlBar onVisibilityChange={handleGridVisibility} buttonLabels={buttonLabels}/>
        </Screen> 
    )
}
export { GroundScreen }