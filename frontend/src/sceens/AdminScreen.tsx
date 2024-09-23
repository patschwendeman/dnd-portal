import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import backgroundMusic from '../../public/journey.mp3'
/* import voice from '../../public/voice_1.mp3' */
import { BattleDetailsSideBar } from '../components/BattleDetailsSideBar'
import { Dialogue } from '../components/Dialogue'
import { DocumentReader } from '../components/DocumentReader'
import { MapOverview } from '../components/MapOverview'
import { SideMaps } from '../components/SideMaps'
import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { Map, SceneDetail } from '../models/models'
import { getAdminData, getSceneById, handleDialogue } from '../service/adminScreen'
import { filterSceneByKey } from '../utils/utils'

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
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    };
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
    background-color: #0E1117;
    border-left: 1px solid #3d444db3
`

const SidebarMapContainer = styled.div`
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #0E1117;
    padding: 20px 0;
`

const BottomBar = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 50px;
    display: flex;
    background-color: ${(props) => props.theme.colors.dark};
    align-items: center;
    justify-content: center;
`

const AudioControlButton = styled.div<{$isMusicPlaying: boolean}>`
    position: absolute;
    left: 20px;
    padding: 10px 20px;
    background-color: ${(props) => (props.$isMusicPlaying ? props.theme.colors.primary : props.theme.colors.secondary)};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 99;
`

const ThemeToggleButton = styled.button`
    position: absolute;
    right: 20px;
    padding: 10px 20px;
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 99;
`

interface AdminScreenProps {
    toggleTheme: () => void;
}

const AdminScreen: FunctionComponent<AdminScreenProps> = ({ toggleTheme }): ReactElement => {
    const { activeSceneId, setActiveSceneId } = useContext(ActiveSceneContext)
    const { setActiveMapId } = useContext(ActiveMapContext)
    const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
    const [activeScene, setActiveScene] = useState<SceneDetail>()

    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

    const [battlemaps, setBattlemaps] = useState<Map[]>([])
    const [sidemaps, setSidemaps] = useState<Map[]>([])
    const [isMainMap, setIsMainMap] = useState<boolean>(false)

    const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false)
    const [activeMusicSRC, setActiveMusicSRC] = useState<string>(backgroundMusic)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    const handleAdminData = (sidemaps: Map[], battlemaps: Map[], scenesDetails: SceneDetail[]) => {
        setBattlemaps(battlemaps)
        setSidemaps(sidemaps)
        setScenesDetails(scenesDetails)
    }

    const handleAudioControl = () => {
        if (!audio) { 
            return
        }
        if (!isMusicPlaying) {
            audio.play()
                .then(() => setIsMusicPlaying(true))
                .catch((err) => { throw new Error(`Failed to play new music: ${err}`) })
        } else {
            audio.pause()
            setIsMusicPlaying(false)
        }
    }

    const handleAudio = () => {
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
    }

    const handleActiveScene = (activeScene: SceneDetail) => {
        setActiveScene(activeScene)
        setIsMainMap(activeScene.fight)
        setActiveMusicSRC(activeScene.music.source)
        /* setActiveMusicSRC(voice) */
        if (activeScene.fight === true && activeScene.battlemaps_id) {
            setActiveMapId(activeScene.battlemaps_id)
        } else {
            setActiveMapId(activeScene.id)
        }   
        handleAudio()
    }

    const fetchAdminData = async () => {
        try {
            const [sidemaps, battlemaps, scenesDetails] = await getAdminData()
            handleAdminData(sidemaps, battlemaps, scenesDetails)
        } catch (err) {
            throw new Error(`Error fetching admin data: ${err}`)
        }   
    }

    const fetchActiveScene = async () => {
        try {
            const activeScene = await getSceneById(activeSceneId)
            handleActiveScene(activeScene) 
        } catch (err) {
            throw new Error(`Error fetching active scene data: ${err}`)
        }
    }

    useEffect(() => {  
        fetchAdminData()
    }, [])

    useEffect(() => { 
        fetchActiveScene()
    }, [activeSceneId])

    const handleSceneSelection = (mapId: number, isMainMap: boolean) => {
        let scene
        if(isMainMap === true) {
            scene = filterSceneByKey('battlemaps_id', mapId, scenesDetails)
        }
        else {
            scene = filterSceneByKey('id', mapId, scenesDetails)
        }
        if (!scene) {
            throw new Error('No Scene to select not found')
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
                    <BattleDetailsSideBar activeScene={ activeScene }/>
                    <SidebarMapContainer>
                        <MapOverview
                            battlemaps={battlemaps}
                            gap='3px'
                            handleSceneSelection={handleSceneSelection}
                            isActiveMainMap={ isMainMap }
                        />
                    </SidebarMapContainer>
                </SidebarRight>
                <BottomBar>
                    <AudioControlButton $isMusicPlaying={ isMusicPlaying } onClick={handleAudioControl}>
                        {isMusicPlaying ? 'Pause' : 'Play'}
                    </AudioControlButton>
                    <SideMaps sidemaps={sidemaps} handleSceneSelection={handleSceneSelection} isActiveMainMap={ isMainMap }/>
                    <ThemeToggleButton onClick={toggleTheme}>
                        Theme
                    </ThemeToggleButton>
                </BottomBar>
                <DocumentReader />
            </Screen>
        </>
    )
}

export { AdminScreen }
