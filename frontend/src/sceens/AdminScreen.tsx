import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import defaultMusic2 from '../../public//assets/music/side_maps/forest/Aincient_Stones.mp3'
import defaultMusic from '../../public//assets/music/side_maps/forest/From_Past_To_Present.mp3'
import { BattleDetailsSideBar } from '../components/BattleDetailsSideBar'
import { Dialogue } from '../components/Dialogue'
import { DocumentReader } from '../components/DocumentReader'
import { MapOverview } from '../components/MapOverview'
import { SideMaps } from '../components/SideMaps'
import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { Map, Music, SceneDetail } from '../models/models'
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
`

const SidebarMapContainer = styled.div`
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    isDarkTheme: boolean;
}

const AdminScreen: FunctionComponent<AdminScreenProps> = ({ toggleTheme, isDarkTheme  }): ReactElement => {
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
    const [activeMusicSRC, setActiveMusicSRC] = useState<string>(defaultMusic)
    const [musicPlaylist, setMusicPlaylist] = useState<string[]>([defaultMusic, defaultMusic2])
    const [lastTrack, setLastTrack] = useState<string>('')

    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    const handleAdminData = (sidemaps: Map[], battlemaps: Map[], scenesDetails: SceneDetail[]) => {
        setBattlemaps(battlemaps)
        setSidemaps(sidemaps)
        setScenesDetails(scenesDetails)
        const initialTrack = getRandomTrack()
        setActiveMusicSRC(initialTrack)
    }

    const getRandomTrack = () => {
        if (musicPlaylist.length <= 1) {
            return musicPlaylist[0]
        }
    
        let randomIndex = 0
    
        do {
            randomIndex = Math.floor(Math.random() * musicPlaylist.length)
        } while (musicPlaylist[randomIndex] === lastTrack)
    
        const selectedTrack = musicPlaylist[randomIndex]
        setLastTrack(selectedTrack)
    
        return selectedTrack
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
    
        const randomTrack = getRandomTrack()
        const newAudio = new Audio(randomTrack)
        newAudio.loop = false	

        newAudio.onended = () => {
            const nextTrack = getRandomTrack()
            setActiveMusicSRC(nextTrack)
        }
        setAudio(newAudio)
    
        if (isMusicPlaying) {
            newAudio.play()
                .catch((err) => { 
                    throw new Error(`Failed to play new music: ${err}`) 
                })
        }
    }

    const extractMusicSources = (musicObject: Music[]) => {
        if (!Array.isArray(musicObject)) {
            throw new Error('Input must be an array')
        }
        return musicObject.map(item => item.source)
    }

    const handleActiveScene = (activeScene: SceneDetail) => {
        const currentPlayList = extractMusicSources(activeScene.music)
        setActiveScene(activeScene)
        setIsMainMap(activeScene.fight)
        const randomTrack = getRandomTrack()
        setActiveMusicSRC(randomTrack)
        setMusicPlaylist(currentPlayList)
        if (activeScene.fight === true && activeScene.battlemaps_id) {
            setActiveMapId(activeScene.battlemaps_id)
        } else {
            setActiveMapId(activeScene.id)
        }   
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

    useEffect(() => {
        if (activeMusicSRC) {
            handleAudio()
        }
    }, [activeMusicSRC])

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
                        {isDarkTheme ? 'Cyber' : 'Classic'}
                    </ThemeToggleButton>
                </BottomBar>
                <DocumentReader />
            </Screen>
        </>
    )
}

export { AdminScreen }
