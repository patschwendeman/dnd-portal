import {
  useCallback, useContext, ReactElement, useEffect, useRef, useState,
} from 'react'
import styled from 'styled-components'

import ActiveScenePanel from '../components/ActiveScenePanel'
import { Dashboard, DashboardItem } from '../components/Dashboard'
import Dialogue from '../components/Dialogue'
import DocumentNavigation from '../components/DocumentNavigation'
import DocumentReader from '../components/DocumentReader'
import ErrorBar from '../components/ErrorBar'
import MusicControl from '../components/MusicControl'
import { NavRail, NavRailItem } from '../components/NavRail'
import SceneNavigation from '../components/SceneNavigation'
import ScreensPanel from '../components/ScreensPanel'
import SoundBoard from '../components/SoundBoard'
import TopBar from '../components/TopBar'
import {
  ActiveAdventureContext, ActiveSceneContext, GameAudioContext, GameTableContext,
} from '../context/context'
import { AdventureSummary, SceneDetail, SoundName } from '../models/models'
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
import GlobalStyle from '../style/GlobalStyle'
import selectDefaultAdventureId from '../utils/adventure'
import { loadLatest } from '../utils/loadSafely'
import nextOpenPanel from '../utils/navRail'
import { filterSceneByKey } from '../utils/utils'

import notesIcon from '/assets/icons/notes.svg'
import scenesIcon from '/assets/icons/scenes.svg'

// Icon button (size.control.md, 40px) plus space.3 on both sides
const NAV_RAIL_WIDTH = '64px'
const LEFT_COLUMN_WIDTH = '240px'
// Below this width the two-column panels of the dashboard get too narrow for their content
const DASHBOARD_MIN_WIDTH = '400px'

const LOAD_ERROR_MESSAGE = 'Backend nicht erreichbar'
const SAVE_ERROR_MESSAGE = 'Änderung konnte nicht gespeichert werden'
const CONNECTION_ERROR_MESSAGE = 'Verbindung zum Server getrennt'

const NAV_PANEL_ID = 'admin-nav-panel'
const DASHBOARD_ID = 'admin-dashboard'

const Screen = styled.div<{ $hasErrorBar: boolean }>`
    display: grid;
    grid-template-rows:
        ${(props) => props.theme.size.bar.md}
        ${(props) => (props.$hasErrorBar ? 'auto ' : '')}1fr;
    position: fixed;
    inset: 0;
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    };
`

// Rail and panel sit flush between Top-Bar and bottom edge; only the content keeps the outer
// padding
const Main = styled.div<{ $isPanelOpen: boolean }>`
    display: grid;
    grid-template-columns: ${NAV_RAIL_WIDTH}
      ${(props) => (props.$isPanelOpen ? `${LEFT_COLUMN_WIDTH} ` : '')}1fr;
    min-height: 0;
`

const NavPanel = styled.div`
    min-height: 0;
    overflow-y: auto;
    padding: ${(props) => props.theme.space[5]} ${(props) => props.theme.space[4]};
    background-color: ${(props) => props.theme.colors.background};
    border-right: ${(props) => props.theme.borderWidth.thin} solid
      ${(props) => props.theme.colors.secondary};
`

// Notes about two thirds, dashboard one third of the width (at least DASHBOARD_MIN_WIDTH); without
// the dashboard the notes take all of it
const Content = styled.div<{ $isDashboardOpen: boolean }>`
    display: grid;
    grid-template-columns: ${(props) => (props.$isDashboardOpen
      ? `minmax(0, 2fr) minmax(${DASHBOARD_MIN_WIDTH}, 1fr)`
      : 'minmax(0, 1fr)')};
    gap: ${(props) => props.theme.space[5]};
    padding: ${(props) => props.theme.space[5]};
    min-width: 0;
    min-height: 0;
`

// A write to the API; the screens change only with the push of the server that follows it
type Save = () => Promise<unknown>

function AdminScreen(): ReactElement {
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { activeSceneId } = useContext(ActiveSceneContext)
  const {
    hasState, theme: gameTableTheme, connected, reconnectNow,
  } = useContext(GameTableContext)
  const { audio } = useContext(GameAudioContext)
  const isMusicPlaying = audio?.playing ?? false
  const [adventures, setAdventures] = useState<AdventureSummary[]>()
  const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
  const [activeScene, setActiveScene] = useState<SceneDetail>()

  const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
  const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()

  // Neither kept on the server nor in localStorage: after a reload the notes panel is open again
  const [openPanel, setOpenPanel] = useState<string | null>('docs')
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0)
  // Not kept either: after a reload the dashboard is shown again
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(true)

  const [adventuresFailed, setAdventuresFailed] = useState<boolean>(false)
  const [adminDataFailed, setAdminDataFailed] = useState<boolean>(false)
  const [activeSceneFailed, setActiveSceneFailed] = useState<boolean>(false)
  const hasLoadError = adventuresFailed || adminDataFailed || activeSceneFailed

  // The last write that failed (scene, adventure or theme), kept so "Erneut versuchen" can repeat
  // it
  const [failedSave, setFailedSave] = useState<{ retry: Save } | null>(null)
  const latestSave = useRef<number>(0)

  // Scenes are only loaded once the adventure is in the loaded list, so they are not requested
  // before the list
  const loadedAdventureId = adventures?.some((adventure) => adventure.id === activeAdventureId)
    ? activeAdventureId
    : null

  // Without an adventure or scene the old data is dropped at once, during render instead of in an
  // effect; a change to another one keeps the old data until the new one is loaded
  const [prevLoadedAdventureId, setPrevLoadedAdventureId] = useState(loadedAdventureId)
  if (loadedAdventureId !== prevLoadedAdventureId) {
    setPrevLoadedAdventureId(loadedAdventureId)
    if (loadedAdventureId === null) {
      setScenesDetails([])
      setAdminDataFailed(false)
    }
  }
  const [prevActiveSceneId, setPrevActiveSceneId] = useState(activeSceneId)
  if (activeSceneId !== prevActiveSceneId) {
    setPrevActiveSceneId(activeSceneId)
    if (activeSceneId === null) {
      setActiveScene(undefined)
      setActiveSceneFailed(false)
    }
  }

  // Retry bumps this counter; all load effects depend on it
  const [reloadCount, setReloadCount] = useState<number>(0)

  const retryLoading = () => {
    setReloadCount((count) => count + 1)
  }

  useEffect(() => {
    let stale = false

    loadLatest(
      getAdventures,
      (loaded) => {
        setAdventures(loaded)
        setAdventuresFailed(false)
      },
      (err) => {
        console.error('Error fetching adventures:', err)
        setAdventuresFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [reloadCount])

  useEffect(() => {
    let stale = false

    if (loadedAdventureId === null) {
      return undefined
    }

    loadLatest(
      () => getAdminData(loadedAdventureId),
      (loaded) => {
        setScenesDetails(loaded)
        setAdminDataFailed(false)
      },
      (err) => {
        console.error('Error fetching admin data:', err)
        setAdminDataFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [loadedAdventureId, reloadCount])

  useEffect(() => {
    let stale = false

    if (activeSceneId === null) {
      return undefined
    }

    loadLatest(
      () => getSceneById(activeSceneId),
      (loaded: SceneDetail) => {
        setActiveScene(loaded)
        setActiveSceneFailed(false)
      },
      (err) => {
        console.error('Error fetching active scene data:', err)
        setActiveSceneFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [activeSceneId, reloadCount])

  // Nothing changes locally: Admin, Wall and Ground switch with the push of the server. Only the
  // latest write may report its result, so an older failure cannot hide a newer success (or the
  // other way round). No automatic retry.
  const runSave = useCallback((save: Save) => {
    latestSave.current += 1
    const request = latestSave.current
    loadLatest(
      save,
      () => setFailedSave(null),
      (err) => {
        console.error('Error saving:', err)
        setFailedSave({ retry: save })
      },
      () => request !== latestSave.current,
    )
  }, [])

  const retrySaving = () => {
    if (failedSave) {
      runSave(failedSave.retry)
    }
  }

  // Without an adventure on the game table the first one of the list is activated, so with a single
  // adventure the Admin works without any selection. Runs again only when the list or the adventure
  // changes, so a failed write is repeated only by "Erneut versuchen".
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

  const handleMusicToggle = () => {
    const playing = !isMusicPlaying
    runSave(() => saveAudio({ playing }))
  }

  const handleVolumeCommit = (volume: number) => {
    runSave(() => saveAudio({ volume }))
  }

  // A late sound effect is pointless, so there is no retry; a missing audio output is no error
  // either
  const handleSound = (name: SoundName) => {
    playSound(name).catch((err) => console.error('Error playing sound:', err))
  }

  // The active scene is already on the game table: no dialog, and no write that would only switch
  // the track
  const handleSceneSelection = (sceneId: number) => {
    if (sceneId === activeSceneId) {
      return
    }
    const scene = filterSceneByKey('id', sceneId, scenesDetails)
    if (!scene) {
      throw new Error('No Scene to select not found')
    }
    setDialogueVisibility(true)
    setSceneOption(scene)
  }

  const handleDialogueOption = (option: boolean, selected: SceneDetail | undefined) => {
    setDialogueVisibility(false)
    if (option && selected && loadedAdventureId !== null) {
      const adventureId = loadedAdventureId
      runSave(() => saveActiveScene(adventureId, selected.id))
    }
  }

  const hasErrorBar = !connected || hasLoadError || failedSave !== null

  const navItems: (NavRailItem & { panel: ReactElement })[] = [
    {
      id: 'docs',
      name: 'Notizen',
      icon: notesIcon,
      panel: (
        <DocumentNavigation
          selectedStoryIndex={selectedStoryIndex}
          onSelectStory={setSelectedStoryIndex}
        />
      ),
    },
    {
      id: 'scenes',
      name: 'Szenen',
      icon: scenesIcon,
      panel: <SceneNavigation scenes={scenesDetails} onSelectScene={handleSceneSelection} />,
    },
  ]
  const openNavItem = navItems.find((item) => item.id === openPanel)

  const handleNavSelect = (id: string) => {
    setOpenPanel((open) => nextOpenPanel(open, id))
  }

  const dashboardPanels: DashboardItem[] = [
    {
      id: 'scene',
      label: 'Aktive Szene',
      columns: 4,
      rows: 2,
      content: <ActiveScenePanel activeScene={activeScene} />,
    },
    {
      id: 'music',
      label: 'Musik',
      columns: 2,
      rows: 2,
      content: (
        <MusicControl
          audio={audio}
          failedSave={failedSave}
          onToggle={handleMusicToggle}
          onVolumeCommit={handleVolumeCommit}
        />
      ),
    },
    {
      id: 'sounds',
      label: 'Sounds',
      columns: 2,
      rows: 2,
      content: <SoundBoard onPlaySound={handleSound} />,
    },
    {
      id: 'screens',
      label: 'Screens',
      columns: 4,
      rows: 2,
      content: <ScreensPanel />,
    },
  ]

  return (
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
          isDashboardOpen={isDashboardOpen}
          dashboardId={DASHBOARD_ID}
          onToggleDashboard={() => setIsDashboardOpen((open) => !open)}
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
            <NavPanel id={NAV_PANEL_ID} aria-label={openNavItem.name} data-test-id="nav-panel">
              {openNavItem.panel}
            </NavPanel>
          )}
          <Content $isDashboardOpen={isDashboardOpen}>
            <DocumentReader selectedStoryIndex={selectedStoryIndex} />
            {isDashboardOpen && <Dashboard id={DASHBOARD_ID} panels={dashboardPanels} />}
          </Content>
        </Main>
      </Screen>
    </>
  )
}

export default AdminScreen
