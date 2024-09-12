import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Dialogue } from '../components/Dialogue'
import { MapOverview } from '../components/MapOverview'
import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getBattlemapsfiltered } from '../service/battlemaps'
import { getSceneDetails, handleDialogue } from '../service/scenes'
import { getSceneByKey } from '../utils/utils'

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

const SidebarRight = styled.div`
    position: fixed;
    display: flex;
    flex-direction: row;
    align-items: end;
    top: 0;
    right: 0;
    bottom: 50px;
    width: 400px;
    background-color: #242424;
`

const SidebarMapContainer = styled.div`
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4b4b4b;
    padding: 20px 0;
`

const BottomBar = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 50px;
    display: flex;
    background-color: #242424;
`

const AdminScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId, setActiveSceneId } = useContext(ActiveSceneContext)
    const { setActiveMapId } = useContext(ActiveMapContext)
    const [sceneDetails, setSceneDetails] = useState<SceneDetail[]>([])
    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

    useEffect(() => {
        getSceneDetails(setSceneDetails)
        getBattlemapsfiltered(setBattlemaps, { players: false })
    }, [])

    useEffect(() => {
        if (sceneDetails.length > 0) {
            const activeScene = getSceneByKey('id', activeSceneId, sceneDetails)
            if (activeScene.battlemaps_id) {
                setActiveMapId(activeScene.battlemaps_id)
            } else {
                console.warn(`Scene with id ${activeSceneId} not found`)
            }
        }
    }, [activeSceneId, sceneDetails, setActiveMapId])

    const handleSceneSelection = (mapId: number) => {
        const scene = getSceneByKey('battlemaps_id', mapId, sceneDetails)
        setDialogueVisibility(true)
        setSceneOption(scene)
    }

    const handleDialogueOption = (option: boolean, sceneOption: SceneDetail | undefined) => {
        handleDialogue(option, sceneOption, setActiveSceneId, setDialogueVisibility)
    }

    return(
        <>
            <Dialogue
                sceneOption={sceneOption}
                handleDialogueOption={handleDialogueOption}
                isVisible={dialogueVisibility}
                setDialogueVisibility={setDialogueVisibility}
            />
            <Screen>
                <SidebarRight>
                    <SidebarMapContainer>
                        <MapOverview
                            battlemaps={battlemaps}
                            gap='3px'
                            handleSceneSelection={handleSceneSelection}
                        />
                    </SidebarMapContainer>
                </SidebarRight>
                <BottomBar></BottomBar>
            </Screen>
        </>
    )
}

export { AdminScreen }
