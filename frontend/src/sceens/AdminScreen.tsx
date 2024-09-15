import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import backgroundMusic from '../../public/journey.mp3'
import { Dialogue } from '../components/Dialogue'
import { MapOverview } from '../components/MapOverview'
import { SideMaps } from '../components/SideMaps'
import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getBattlemapsfiltered, getsidemaps } from '../service/battlemaps'
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
    flex-direction: column;
    align-items: end;
    top: 0;
    right: 0;
    bottom: 50px;
    width: 400px;
    background-color: #242424;
`

const BattleDetails = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    top: 0;
    right: 0;
    background-color: blue;
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
    align-items: center;
    justify-content: center;
`

const StartMusicButton = styled.button`
    position: absolute;
    left: 20px;
    padding: 10px 20px;
    background-color: #4b4b4b;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 99;
`

const AdminScreen: FunctionComponent = (): ReactElement => {
    const { activeSceneId, setActiveSceneId } = useContext(ActiveSceneContext)
    const { setActiveMapId } = useContext(ActiveMapContext)
    const [sceneDetails, setSceneDetails] = useState<SceneDetail[]>([])
    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()
    const [sidemaps, setSidemaps] = useState<Map[]>([])
    const [isActiveMainMap, setIsActiveMainMap] = useState<boolean>(false)

    const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false)
    const [activeMusicSRC, setActiveMusicSRC] = useState<string>(backgroundMusic)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    useEffect(() => {
        getSceneDetails(setSceneDetails)
        getBattlemapsfiltered(setBattlemaps, { players: false })
        getsidemaps(setSidemaps)
    }, [])

    useEffect(() => {
        if (audio) {
            audio.pause()
            audio.currentTime = 0
        }
    
        const newAudio = new Audio(activeMusicSRC)
        newAudio.loop = true
        setAudio(newAudio)
    
        if (isMusicPlaying) {
            newAudio.play()
                .catch((err) => { throw new Error(`Failed to play new music: ${err}`) })
        }
    }, [activeMusicSRC])

    useEffect(() => {
        if (sceneDetails.length > 0) {
            const activeScene = getSceneByKey('id', activeSceneId, sceneDetails)
            if(activeScene.fight === true) {
                if (!activeScene.battlemaps_id) {
                    throw new Error('active Scene not found')
                }
                if(activeScene.battlemaps_id) {
                    setActiveMapId(activeScene.battlemaps_id)
                    setIsActiveMainMap(true)
                }
            }
            else {
                setActiveMapId(activeScene.id)
                setIsActiveMainMap(false)
            } 
            setActiveMusicSRC(activeScene.music.source)   
        }
    }, [activeSceneId])

    const handleStartMusic = () => {
        if (!audio){ return}

        if (!isMusicPlaying) {
            audio.play()
                .then(() => setIsMusicPlaying(true))
                .catch((err) => { throw new Error(`Failed to play new music: ${err}`) })
        } else {
            audio.pause()
            setIsMusicPlaying(false)
        }
    }


    const handleSceneSelection = (mapId: number, isMainMap: boolean) => {
 
        let scene
        if(isMainMap === true) {
            scene = getSceneByKey('battlemaps_id', mapId, sceneDetails)
        }
        else {
            scene = getSceneByKey('id', mapId, sceneDetails)
        }
        if (!scene) {
            throw new Error('No Scene to scelect not found')
        }
        
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
                <BattleDetails>
                </BattleDetails>
                    <SidebarMapContainer>
                        <MapOverview
                            battlemaps={battlemaps}
                            gap='3px'
                            handleSceneSelection={handleSceneSelection}
                            isActiveMainMap={ isActiveMainMap }
                        />
                    </SidebarMapContainer>
                </SidebarRight>
                <BottomBar>
                <StartMusicButton onClick={handleStartMusic}>
                    Play
                </StartMusicButton>
                    <SideMaps sidemaps={sidemaps} handleSceneSelection={handleSceneSelection} isActiveMainMap={ isActiveMainMap }/>
                </BottomBar>
            </Screen>
        </>
    )
}

export { AdminScreen }
