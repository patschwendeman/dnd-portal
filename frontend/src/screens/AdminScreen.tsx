import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import { useCallback, useContext, FunctionComponent, ReactElement, useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'

import { DetailsSideBar } from '../components/DetailsSideBar'
import { Dialogue } from '../components/Dialogue'
import { DocumentNavigation } from '../components/DocumentNavigation'
import { DocumentReader } from '../components/DocumentReader'
import { ErrorBar } from '../components/ErrorBar'
import { Label } from '../components/Label'
import { MapOverview } from '../components/MapOverview'
import { NavRail, NavRailItem } from '../components/NavRail'
import { SideMaps } from '../components/SideMaps'
import { TopBar } from '../components/TopBar'
import { ActiveAdventureContext, ActiveSceneContext, GameAudioContext, GameTableContext } from '../context/context'
import { AdventureSummary, Map, SceneDetail, SoundName } from '../models/models'
import {
    getAdminData,
    getAdventures,
    getSceneById,
    playSound,
    saveActiveAdventure,
    saveActiveScene,
    saveAudio,
    saveTheme,
} from '../service/adminScreen'
import { GlobalStyle } from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { selectDefaultAdventureId } from '../utils/adventure'
import { loadLatest } from '../utils/loadSafely'
import { nextOpenPanel } from '../utils/navRail'
import { filterSceneByKey, getMusicTitle } from '../utils/utils'

import { ReactSVG } from 'react-svg'

import notesIcon from '/assets/icons/notes.svg'
import playIcon from '/assets/icons/play.svg'
import pauseIcon from '/assets/icons/pause.svg'

// Icon button (size.control.md, 40px) plus space.3 on both sides
const NAV_RAIL_WIDTH = '64px'
const LEFT_COLUMN_WIDTH = '200px'
const RIGHT_COLUMN_WIDTH = '400px'
const VOLUME_SLIDER_WIDTH = '120px'
const VOLUME_SLIDER_THUMB_SIZE = '16px'

const LOAD_ERROR_MESSAGE = 'Backend nicht erreichbar'
const SAVE_ERROR_MESSAGE = 'Änderung konnte nicht gespeichert werden'
const CONNECTION_ERROR_MESSAGE = 'Verbindung zum Server getrennt'
const NO_AUDIO_OUTPUT_MESSAGE = 'Keine Audioausgabe bereit'

const NAV_PANEL_ID = 'admin-nav-panel'

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

// Rail and panel sit flush between Top-Bar and Bottom-Bar; only the content keeps the outer padding
const Main = styled.div<{ $isPanelOpen: boolean }>`
    display: grid;
    grid-template-columns: ${NAV_RAIL_WIDTH} ${(props) => (props.$isPanelOpen ? `${LEFT_COLUMN_WIDTH} ` : '')}1fr;
    min-height: 0;
`

const NavPanel = styled.div`
    min-height: 0;
    overflow-y: auto;
    padding: ${(props) => props.theme.space[3]};
    background-color: ${(props) => props.theme.colors.background};
    border-right: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.secondary};
`

const Content = styled.div`
    display: grid;
    grid-template-columns: 1fr ${RIGHT_COLUMN_WIDTH};
    gap: ${(props) => props.theme.space[5]};
    padding: ${(props) => props.theme.space[5]};
    min-width: 0;
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
    min-width: 0;
    padding-right: ${(props) => props.theme.space[5]};
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
    flex: 1;
    flex-direction: column;
    min-width: 0;
`

const TrackName = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const AudioHint = styled.span`
    ${textStyle('sm')}
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const VolumeSlider = styled(Slider)`
  & .MuiSlider-thumb {
    width: ${VOLUME_SLIDER_THUMB_SIZE};
    height: ${VOLUME_SLIDER_THUMB_SIZE};
    background-color: ${(props) => props.theme.colors.text.color};
    &:focus,
    &:hover,
    &:active {
      box-shadow: none;
    }
  }
  & .MuiSlider-rail {
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: ${(props) => props.theme.radius.pill};
  }
  & .MuiSlider-track {
    background-color: ${(props) => props.theme.colors.primary};
    border: none;
  }
`

// A write to the API; the screens change only with the push of the server that follows it
type Save = () => Promise<unknown>

const AdminScreen: FunctionComponent = (): ReactElement => {
    const theme = useTheme()

    const { activeAdventureId } = useContext(ActiveAdventureContext)
    const { activeSceneId } = useContext(ActiveSceneContext)
    const { hasState, theme: gameTableTheme, connected, reconnectNow } = useContext(GameTableContext)
    const { audio } = useContext(GameAudioContext)
    const isMusicPlaying = audio?.playing ?? false
    // Only while the slider is dragged; afterwards it shows the volume pushed by the server
    const [draggedVolume, setDraggedVolume] = useState<number | null>(null)
    const [adventures, setAdventures] = useState<AdventureSummary[]>()
    const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
    const [activeScene, setActiveScene] = useState<SceneDetail>()

    const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
    const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

    const [mainmaps, setMainmaps] = useState<Map[]>([])
    const [sidemaps, setSidemaps] = useState<Map[]>([])

    // Neither kept on the server nor in localStorage: after a reload the notes panel is open again
    const [openPanel, setOpenPanel] = useState<string | null>('docs')
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0)

    const [adventuresFailed, setAdventuresFailed] = useState<boolean>(false)
    const [adminDataFailed, setAdminDataFailed] = useState<boolean>(false)
    const [activeSceneFailed, setActiveSceneFailed] = useState<boolean>(false)
    const hasLoadError = adventuresFailed || adminDataFailed || activeSceneFailed

    // The last write that failed (scene, adventure or theme), kept so "Erneut versuchen" can repeat it
    const [failedSave, setFailedSave] = useState<{ retry: Save } | null>(null)
    const latestSave = useRef<number>(0)

    // Scenes are only loaded once the adventure is in the loaded list, so they are not requested before the list
    const loadedAdventureId = adventures?.some((adventure) => adventure.id === activeAdventureId)
        ? activeAdventureId
        : null

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
    }, [reloadCount])

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
            () => getAdminData(loadedAdventureId),
            ([sidemaps, mainmaps, scenesDetails]) => {
                setMainmaps(mainmaps)
                setSidemaps(sidemaps)
                setScenesDetails(scenesDetails)
                setAdminDataFailed(false)
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
    }, [loadedAdventureId, reloadCount])

    useEffect(() => {
        let stale = false

        if (activeSceneId === null) {
            setActiveScene(undefined)
            setActiveSceneFailed(false)
            return
        }

        loadLatest(
            () => getSceneById(activeSceneId),
            (activeScene: SceneDetail) => {
                setActiveScene(activeScene)
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
    }, [activeSceneId, reloadCount])

    // Nothing changes locally: Admin, Wall and Ground switch with the push of the server. Only the latest write may
    // report its result, so an older failure cannot hide a newer success (or the other way round). No automatic retry.
    const runSave = useCallback((save: Save) => {
        const request = ++latestSave.current
        loadLatest(
            save,
            () => setFailedSave(null),
            (err) => {
                console.error('Error saving:', err)
                setFailedSave({ retry: save })
            },
            () => request !== latestSave.current
        )
    }, [])

    const retrySaving = () => {
        if (failedSave) {
            runSave(failedSave.retry)
        }
    }

    // Without an adventure on the game table the first one of the list is activated, so with a single adventure the
    // Admin works without any selection. Runs again only when the list or the adventure changes, so a failed write is
    // repeated only by "Erneut versuchen".
    useEffect(() => {
        if (!hasState || adventures === undefined) {
            return
        }
        const defaultAdventureId = selectDefaultAdventureId(adventures, activeAdventureId)
        if (defaultAdventureId !== null && defaultAdventureId !== activeAdventureId) {
            runSave(() => saveActiveAdventure(defaultAdventureId))
        }
    }, [hasState, adventures, activeAdventureId, runSave])

    const handleAdventureSelection = (adventureId: number) => {
        if (adventureId === activeAdventureId) {
            return
        }
        runSave(() => saveActiveAdventure(adventureId))
    }

    const handleThemeToggle = () => {
        const nextTheme = gameTableTheme === 'dark' ? 'tavern' : 'dark'
        runSave(() => saveTheme(nextTheme))
    }

    useEffect(() => {
        setDraggedVolume(null)
    }, [audio, failedSave])

    const handleMusicToggle = () => {
        const playing = !isMusicPlaying
        runSave(() => saveAudio({ playing }))
    }

    const handleVolumeCommit = (_event: unknown, value: number | number[]) => {
        const volume = value as number
        runSave(() => saveAudio({ volume }))
    }

    // A late sound effect is pointless, so there is no retry; a missing audio output is no error either
    const handleSound = (name: SoundName) => {
        playSound(name).catch((err) => console.error('Error playing sound:', err))
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
        setDialogueVisibility(false)
        if (option && sceneOption && loadedAdventureId !== null) {
            const adventureId = loadedAdventureId
            runSave(() => saveActiveScene(adventureId, sceneOption.id))
        }
    }

    const hasErrorBar = !connected || hasLoadError || failedSave !== null

    const navItems: (NavRailItem & { panel: ReactElement })[] = [
        {
            id: 'docs',
            name: 'Notizen',
            icon: notesIcon,
            panel: <DocumentNavigation selectedStoryIndex={selectedStoryIndex} onSelectStory={setSelectedStoryIndex} />,
        },
    ]
    const openNavItem = navItems.find((item) => item.id === openPanel)

    const handleNavSelect = (id: string) => {
        setOpenPanel((open) => nextOpenPanel(open, id))
    }

    return(
        <>
            <GlobalStyle />
            <Dialogue
                sceneOption={sceneOption}
                handleDialogueOption={handleDialogueOption}
                isVisible={dialogueVisibility}
            />
            <Screen $hasErrorBar={hasErrorBar}>
                <TopBar
                    onToggleTheme={handleThemeToggle}
                    adventures={adventures ?? []}
                    activeAdventureId={activeAdventureId}
                    onSelectAdventure={handleAdventureSelection}
                    onPlaySound={handleSound}
                />
                {hasErrorBar && (
                    <div>
                        {!connected && <ErrorBar message={CONNECTION_ERROR_MESSAGE} onRetry={reconnectNow} />}
                        {hasLoadError && <ErrorBar message={LOAD_ERROR_MESSAGE} onRetry={retryLoading} />}
                        {failedSave !== null && <ErrorBar message={SAVE_ERROR_MESSAGE} onRetry={retrySaving} />}
                    </div>
                )}
                <Main $isPanelOpen={openNavItem !== undefined}>
                    <NavRail
                        items={navItems}
                        openItemId={openNavItem?.id ?? null}
                        panelId={NAV_PANEL_ID}
                        onSelect={handleNavSelect}
                    />
                    {openNavItem && (
                        <NavPanel id={NAV_PANEL_ID} aria-label={openNavItem.name} data-test-id='nav-panel'>
                            {openNavItem.panel}
                        </NavPanel>
                    )}
                    <Content>
                        <DocumentReader selectedStoryIndex={selectedStoryIndex} />
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
                    </Content>
                </Main>
                <BottomBar>
                    <Music>
                        <AudioControlButton $isMusicPlaying={ isMusicPlaying } onClick={ handleMusicToggle }>
                            <ReactSVG
                                src={isMusicPlaying ? pauseIcon : playIcon}
                                beforeInjection={(svg) => {
                                svg.setAttribute('style', `fill: ${isMusicPlaying ? theme.colors.onPrimary : theme.colors.text.color}`)
                                }}
                            />
                        </AudioControlButton>
                        <Track>
                            <Label>Musik</Label>
                            <TrackName>{ getMusicTitle(audio?.track?.source ?? '') }</TrackName>
                            {audio !== null && !audio.output_ready && <AudioHint>{ NO_AUDIO_OUTPUT_MESSAGE }</AudioHint>}
                        </Track>
                        <Box sx={{ width: VOLUME_SLIDER_WIDTH, margin: 0, flexShrink: 0 }}>
                            <VolumeSlider
                                aria-label='Lautstärke'
                                value={draggedVolume ?? audio?.volume ?? 0}
                                onChange={(_event, value) => setDraggedVolume(value as number)}
                                onChangeCommitted={handleVolumeCommit}
                                min={0}
                                max={100}
                            />
                        </Box>
                    </Music>
                    <SideMaps sidemaps={sidemaps} handleSceneSelection={handleSceneSelection} />
                    <div />
                </BottomBar>
            </Screen>
        </>
    )
}

export { AdminScreen }
