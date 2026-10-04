import { useContext, FunctionComponent, ReactElement, useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components'

import defaultMusic from '../../public//assets/music/side_maps/forest/From_Past_To_Present.mp3'
import { DetailsSideBar } from '../components/DetailsSideBar'
import { Dialogue } from '../components/Dialogue'
import { DocumentReader } from '../components/DocumentReader'
import { Label } from '../components/Label'
import { MapOverview } from '../components/MapOverview'
import { SideMaps } from '../components/SideMaps'
import { TopBar } from '../components/TopBar'
import { ActiveMapContext, ActiveSceneContext } from '../context/context'
import { Map, type Music, SceneDetail } from '../models/models'
import { getAdminData, getSceneById, handleDialogue } from '../service/adminScreen'
import { GlobalStyle } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { filterSceneByKey, getMusicTitle, handleAudio, handleAudioControl, getRandomTrack } from '../utils/utils'

import { ReactSVG } from 'react-svg'

import playIcon from '/assets/icons/play.svg'
import pauseIcon from '/assets/icons/pause.svg'

const LEFT_COLUMN_WIDTH = '200px'
const RIGHT_COLUMN_WIDTH = '400px'

const Screen = styled.div`
    display: grid;
    grid-template-rows: ${(props) => props.theme.size.bar.md} 1fr ${(props) => props.theme.size.bar.lg};
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    };
`

const Main = styled.div`
    display: grid;
    grid-template-columns: ${LEFT_COLUMN_WIDTH} 1fr ${RIGHT_COLUMN_WIDTH};
    gap: ${(props) => props.theme.space[5]};
    padding: ${(props) => props.theme.space[5]};
    min-height: 0;
`

const SidebarRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: ${(props) => props.theme.space[5]};
    min-height: 0;
`

const SidebarMapContainer = styled.div`
    width: 100%;
    height: auto;
    display: block;
    padding: ${(props) => props.theme.space[5]};
    border-radius: ${(props) => props.theme.radius.lg};
    background-color: ${(props) => props.theme.colors.secondary};
`

const SectionHead = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: ${(props) => props.theme.space[3]};
`

const BottomBar = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 ${(props) => props.theme.space[5]};
    background-color: ${(props) => props.theme.colors.dark};
`

const Music = styled.div`
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.space[3]};
`

const AudioControlButton = styled.div<{$isMusicPlaying: boolean}>`
    display: grid;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    padding: 0;
    background-color: ${(props) => (props.$isMusicPlaying ? props.theme.colors.primary : props.theme.colors.secondary)};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;
    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
`

const Track = styled.div`
    display: flex;
    flex-direction: column;
`

const TrackName = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
`

interface AdminScreenProps {
    toggleTheme: () => void;
}

const AdminScreen: FunctionComponent<AdminScreenProps> = ({ toggleTheme }): ReactElement => {
    const theme = useTheme()

    const { activeSceneId, setActiveSceneId } = useContext(ActiveSceneContext)
    const { setActiveMapId } = useContext(ActiveMapContext)
    const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
    const [activeScene, setActiveScene] = useState<SceneDetail>()

    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

    const [mainmaps, setMainmaps] = useState<Map[]>([])
    const [sidemaps, setSidemaps] = useState<Map[]>([])
    const [isMainMap, setIsMainMap] = useState<boolean>(false)

    const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false)
    const [activeMusicSRC, setActiveMusicSRC] = useState<string>(defaultMusic)
    const [musicPlaylist, setMusicPlaylist] = useState<string[]>([defaultMusic])
    const [lastTrack, setLastTrack] = useState<string>('')

    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

    const handleAdminData = (sidemaps: Map[], mainmaps: Map[], scenesDetails: SceneDetail[]) => {
        setMainmaps(mainmaps)
        setSidemaps(sidemaps)
        setScenesDetails(scenesDetails)
        const initialTrack = getRandomTrack(musicPlaylist, lastTrack)
        setActiveMusicSRC(initialTrack)
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
        setIsMainMap(activeScene.main)
        const randomTrack = getRandomTrack(musicPlaylist, lastTrack)
        setActiveMusicSRC(randomTrack)
        setMusicPlaylist(currentPlayList)
        setActiveMapId(activeScene.id)  
    }

    const fetchAdminData = async () => {
        try {
            const [sidemaps, mainmaps, scenesDetails] = await getAdminData()
            handleAdminData(sidemaps, mainmaps, scenesDetails)
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
            handleAudio(isMusicPlaying, setLastTrack,  setActiveMusicSRC, musicPlaylist, lastTrack, setAudio, audio)
        }
    }, [activeMusicSRC])

    const handleSceneSelection = (mapId: number) => {
        const scene = filterSceneByKey('id', mapId, scenesDetails)
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
            <GlobalStyle />
            <Dialogue
                sceneOption={sceneOption}
                handleDialogueOption={handleDialogueOption}
                isVisible={dialogueVisibility}
                setDialogueVisibility={setDialogueVisibility}
            />
            <Screen>
                <TopBar toggleTheme={toggleTheme} />
                <Main>
                    <DocumentReader />
                    <SidebarRight>
                        <DetailsSideBar activeScene={ activeScene }/>
                        <SidebarMapContainer>
                            <SectionHead>
                                <Label>Kampfszenen</Label>
                                <Label>{ mainmaps.length }</Label>
                            </SectionHead>
                            <MapOverview
                                mainmaps={mainmaps}
                                gap={theme.space[2]}
                                padding='0'
                                handleSceneSelection={handleSceneSelection}
                                isActiveMainMap={ isMainMap }
                                isAdminScreen={ true }
                            />
                        </SidebarMapContainer>
                    </SidebarRight>
                </Main>
                <BottomBar>
                    <Music>
                        <AudioControlButton $isMusicPlaying={ isMusicPlaying } onClick={() => handleAudioControl(audio, isMusicPlaying, setIsMusicPlaying)}>
                            <ReactSVG
                                src={isMusicPlaying ? pauseIcon : playIcon}
                                beforeInjection={(svg) => {
                                svg.setAttribute('style', `fill: ${isMusicPlaying ? theme.colors.onPrimary : theme.colors.text.color}`)
                                }}
                            />
                        </AudioControlButton>
                        <Track>
                            <Label>Musik</Label>
                            <TrackName>{ getMusicTitle(activeMusicSRC) }</TrackName>
                        </Track>
                    </Music>
                    <SideMaps sidemaps={sidemaps} handleSceneSelection={handleSceneSelection} isActiveMainMap={ isMainMap }/>
                    <div />
                </BottomBar>
            </Screen>
        </>
    )
}

export { AdminScreen }
