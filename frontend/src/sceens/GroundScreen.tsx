import { useContext, FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { ActiveSceneContext } from '../context/context'

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
    const { activeScene } = useContext(ActiveSceneContext)
    return(
        <><Screen>
            <BackgroundImage src='/test.jpg' alt='' />

        </Screen>
        <p>{activeScene}</p>
        </> 
    )
}
export { GroundScreen }