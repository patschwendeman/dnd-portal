import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

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
    z-index: 1;
    position: fixed;
`

const GroundScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [imageSRC, setImageSRC] = useState<string>('')

    const handleGroundScreen = (activeScene: SceneDetail) => {
        let src
        if (activeScene.fight === true) {
            src = getMediaSRC(activeScene, 'battlemaps')
            
        } else {
            src = activeScene.graphics_ground.source
        }

        setImageSRC(src)
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
            <BackgroundImage data-test-id='groundImg' src={imageSRC} alt='' />
        </Screen> 
    )
}
export { GroundScreen }