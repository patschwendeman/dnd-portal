import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { ActiveSceneContext } from '../context/context'
import { handleGroundScreen } from '../service/scenes'

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

const BackgroundImage = styled.img`
    width: 100%;
    z-index: 1;
    position: fixed;
`

const GroundScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId } = useContext(ActiveSceneContext)
    const [imageSRC, setImageSRC] = useState<string>('')

    useEffect(() => {
        handleGroundScreen(activeSceneId, 'battlemaps', setImageSRC)
    }, [activeSceneId])

    return(
        <>
            <Screen>
                <BackgroundImage data-test-id='groundImg' src={imageSRC} alt='' />

            </Screen>
            <p>{activeSceneId}</p>
        </> 
    )
}
export { GroundScreen }