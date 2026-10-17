import { useContext, FunctionComponent, ReactElement, useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'

import defaultMusic from '../../public/assets/music/side/forest/From_Past_To_Present.mp3'
import { mediaUrl } from '../api/mediaUrl'
import { DetailsSideBar } from '../components/DetailsSideBar'
import { Dialogue } from '../components/Dialogue'
import { DocumentReader } from '../components/DocumentReader'
import { ErrorBar } from '../components/ErrorBar'
import { Label } from '../components/Label'
import { MapOverview } from '../components/MapOverview'
import { SideMaps } from '../components/SideMaps'
import { TopBar } from '../components/TopBar'
import { ActiveAdventureContext, ActiveSceneContext } from '../context/context'
import { useMusicPlayer } from '../hooks/useMusicPlayer'
import { AdventureSummary, Map, SceneDetail } from '../models/models'
import {
    getAdminData,
    getAdventure,
    getAdventures,
    getSceneById,
    handleDialogue,
    saveActiveScene,
} from '../service/adminScreen'
import { GlobalStyle } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { selectDefaultAdventureId } from '../utils/adventure'
import { loadLatest } from '../utils/loadSafely'
import { createSceneAdoption, SceneAdoption } from '../utils/sceneAdoption'
import { filterSceneByKey, getMusicTitle } from '../utils/utils'

import { ReactSVG } from 'react-svg'

import playIcon from '/assets/icons/play.svg'
import pauseIcon from '/assets/icons/pause.svg'

const LEFT_COLUMN_WIDTH = '200px'
const RIGHT_COLUMN_WIDTH = '400px'

const LOAD_ERROR_MESSAGE = 'Backend nicht erreichbar'
const SAVE_ERROR_MESSAGE = 'Aktive Szene konnte nicht gespeichert werden'

const Screen = styled.div<{ $hasErrorBar: boolean }>`
    display: grid;
    grid-template-rows: ${(props) => props.theme.size.bar.md} ${(props) => (props.$hasErrorBar ? 'auto ' : '')}1fr ${(props) => props.theme.size.bar.lg};
    position: fixed;
    inset: 0;
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

    const { activeAdventureId, setActiveAdventureId } = useContext(ActiveAdventureContext)
    const { activeSceneId, setActiveSceneId } = useContext(ActiveSceneContext)
    const [adventures, setAdventures] = useState<AdventureSummary[]>()
    const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
    const [activeScene, setActiveScene] = useState<SceneDetail>()

    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

    const [mainmaps, setMainmaps] = useState<Map[]>([])
    const [sidemaps, setSidemaps] = useState<Map[]>([])

    const [adventuresFailed, setAdventuresFailed] = useState<boolean>(false)
    const [adminDataFailed, setAdminDataFailed] = useState<boolean>(false)
    const [activeSceneFailed, setActiveSceneFailed] = useState<boolean>(false)
    const hasLoadError = adventuresFailed || adminDataFailed || activeSceneFailed

    // The last save that failed, kept so "Erneut versuchen" can repeat it
    const [failedSave, setFailedSave] = useState<{ adventureId: number, sceneId: number } | null>(null)
    const latestSave = useRef<number>(0)

    // Decides when the stored active scene of the loaded adventure is taken over (once per selection)
    const sceneAdoption = useRef<SceneAdoption>(createSceneAdoption())

    // Scenes are only loaded for an adventure that exists, so a stale ID from localStorage triggers no failing request
    const loadedAdventureId = adventures?.some((adventure) => adventure.id === activeAdventureId)
        ? activeAdventureId
        : null

    // Until the active scene is loaded, the default track is the playlist
    const music = useMusicPlayer([defaultMusic])

    // Stable across renders (useCallback in useMusicPlayer), so it does not retrigger the scene effect
    const { setPlaylist: setMusicPlaylist } = music

    // Retry bumps this counter; all load effects depend on it
    const [reloadCount, setReloadCount] = useState<number>(0)

    const retryLoading = () => {
        setReloadCount((count) => count + 1)
    }

    useEffect(() => {
        let stale = false

        loadLatest(
            getAdventures,
            (adventures) => {
                setAdventures(adventures)
                setActiveAdventureId((storedId) => selectDefaultAdventureId(adventures, storedId))
                setAdventuresFailed(false)
            },
            (err) => {
                console.error('Error fetching adventures:', err)
                setAdventuresFailed(true)
            },
            () => stale
        )

        return () => {
            stale = true
        }
    }, [reloadCount, setActiveAdventureId])

    useEffect(() => {
        let stale = false

        if (loadedAdventureId === null) {
            setMainmaps([])
            setSidemaps([])
            setScenesDetails([])
            setAdminDataFailed(false)
            return
        }

        loadLatest(
            () => Promise.all([getAdventure(loadedAdventureId), getAdminData(loadedAdventureId)]),
            ([adventure, [sidemaps, mainmaps, scenesDetails]]) => {
                setMainmaps(mainmaps)
                setSidemaps(sidemaps)
                setScenesDetails(scenesDetails)
                setAdminDataFailed(false)
                if (sceneAdoption.current.claim(loadedAdventureId)) {
                    setActiveSceneId(adventure.active_scene_id)
                }
            },
            (err) => {
                console.error('Error fetching admin data:', err)
                setAdminDataFailed(true)
            },
            () => stale
        )

        return () => {
            stale = true
        }
    }, [loadedAdventureId, reloadCount, setActiveSceneId])

    useEffect(() => {
        let stale = false

        if (activeSceneId === null) {
            setActiveScene(undefined)
            setMusicPlaylist([defaultMusic])
            setActiveSceneFailed(false)
            return
        }

        loadLatest(
            () => getSceneById(activeSceneId),
            (activeScene: SceneDetail) => {
                setActiveScene(activeScene)
                setMusicPlaylist(activeScene.tracks.map((item) => mediaUrl(item.source)))
                setActiveSceneFailed(false)
            },
            (err) => {
                console.error('Error fetching active scene data:', err)
                setActiveSceneFailed(true)
            },
            () => stale
        )

        return () => {
            stale = true
        }
    }, [activeSceneId, reloadCount, setMusicPlaylist])

    // The scene is already active locally; only the latest save may report its result, so an older failure cannot
    // hide a newer success (or the other way round)
    const saveScene = (adventureId: number, sceneId: number) => {
        const request = ++latestSave.current
        loadLatest(
            () => saveActiveScene(adventureId, sceneId),
            () => setFailedSave(null),
            (err) => {
                console.error('Error saving active scene:', err)
                setFailedSave({ adventureId, sceneId })
            },
            () => request !== latestSave.current
        )
    }

    const retrySaving = () => {
        if (failedSave) {
            saveScene(failedSave.adventureId, failedSave.sceneId)
        }
    }

    const handleAdventureSelection = (adventureId: number) => {
        if (adventureId === activeAdventureId) {
            return
        }
        // Cleared first, so Wall and Ground never briefly show a scene of the previous adventure
        setActiveSceneId(null)
        sceneAdoption.current.select()
        setActiveAdventureId(adventureId)
    }

    const handleSceneSelection = (sceneId: number) => {
        const scene = filterSceneByKey('id', sceneId, scenesDetails)
        if (!scene) {
            throw new Error('No Scene to select not found')
        }
        setDialogueVisibility(true)
        setSceneOption(scene)
    }

    const handleDialogueOption = (option: boolean, sceneOption: SceneDetail | undefined) => {
        handleDialogue(option, sceneOption, setActiveSceneId, setDialogueVisibility)
        if (option && sceneOption && loadedAdventureId !== null) {
            saveScene(loadedAdventureId, sceneOption.id)
        }
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
            <Screen $hasErrorBar={hasLoadError || failedSave !== null}>
                <TopBar
                    toggleTheme={toggleTheme}
                    adventures={adventures ?? []}
                    activeAdventureId={activeAdventureId}
                    onSelectAdventure={handleAdventureSelection}
                />
                {(hasLoadError || failedSave !== null) && (
                    <div>
                        {hasLoadError && <ErrorBar message={LOAD_ERROR_MESSAGE} onRetry={retryLoading} />}
                        {failedSave !== null && <ErrorBar message={SAVE_ERROR_MESSAGE} onRetry={retrySaving} />}
                    </div>
                )}
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
                                isAdminScreen={ true }
                            />
                        </SidebarMapContainer>
                    </SidebarRight>
                </Main>
                <BottomBar>
                    <Music>
                        <AudioControlButton $isMusicPlaying={ music.isPlaying } onClick={ music.toggle }>
                            <ReactSVG
                                src={music.isPlaying ? pauseIcon : playIcon}
                                beforeInjection={(svg) => {
                                svg.setAttribute('style', `fill: ${music.isPlaying ? theme.colors.onPrimary : theme.colors.text.color}`)
                                }}
                            />
                        </AudioControlButton>
                        <Track>
                            <Label>Musik</Label>
                            <TrackName>{ getMusicTitle(music.track ?? '') }</TrackName>
                        </Track>
                    </Music>
                    <SideMaps sidemaps={sidemaps} handleSceneSelection={handleSceneSelection} />
                    <div />
                </BottomBar>
            </Screen>
        </>
    )
}

export { AdminScreen }
