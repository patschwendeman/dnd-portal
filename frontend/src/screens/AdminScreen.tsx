import {
  useCallback, useContext, ReactElement, useEffect, useRef, useState,
} from 'react'
import styled from 'styled-components'

import useAudioPlayback from '../audio/useAudioPlayback'
import useAutoAudioOutput from '../audio/useAutoAudioOutput'
import ActiveScenePanel from '../components/ActiveScenePanel'
import AdminHeader from '../components/AdminHeader'
import AdventureBackground from '../components/AdventureBackground'
import AudioPanel from '../components/AudioPanel'
import Dashboard from '../components/Dashboard'
import DashboardPanel from '../components/DashboardPanel'
import Dialogue from '../components/Dialogue'
import DocumentNavigation from '../components/DocumentNavigation'
import DocumentReader from '../components/DocumentReader'
import GameTablePanel from '../components/GameTablePanel'
import LevelStepper from '../components/LevelStepper'
import { NavRail, NavRailItem } from '../components/NavRail'
import PlayersPanel from '../components/PlayersPanel'
import SceneNavigation from '../components/SceneNavigation'
import {
  ActiveAdventureContext, ActiveSceneContext, GameAudioContext, GameTableContext,
} from '../context/context'
import {
  AdventureDetail, AdventureSummary, GroundGrid, SceneDetail, SoundName, WallOverlay,
} from '../models/models'
import {
  getAdminData,
  getAdventure,
  getAdventures,
  getSceneById,
  playSound,
  saveActiveAdventure,
  saveActiveScene,
  saveAudio,
  saveGlobalLevel,
  saveTheme,
} from '../service/adminScreen'
import { saveGroundGrid, saveGroundGridCellSize, saveWallOverlay } from '../service/gameTable'
import GlobalStyle, { hoverScrollbar, tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import mostImportantError from '../utils/adminError'
import selectDefaultAdventureId from '../utils/adventure'
import { loadLatest } from '../utils/loadSafely'
import nextOpenPanel from '../utils/navRail'
import { useAdventureBackground } from '../utils/useAdventureBackground'
import { filterSceneByKey } from '../utils/utils'

import notesIcon from '/assets/icons/notes.svg'
import scenesIcon from '/assets/icons/scenes.svg'

// Icon button (size.control.md, 40px) plus space.3 on both sides
const NAV_RAIL_WIDTH = '64px'
const LEFT_COLUMN_WIDTH = '240px'
// Below this width the rows of the panel "Spieltisch" get too narrow for their controls
const DASHBOARD_MIN_WIDTH = '400px'
// Above this width the stage would push the panel "Audio" out of sight on large monitors
const DASHBOARD_MAX_WIDTH = '560px'

const LOAD_ERROR_MESSAGE = 'Backend nicht erreichbar'
const SAVE_ERROR_MESSAGE = 'Änderung konnte nicht gespeichert werden'
const CONNECTION_ERROR_MESSAGE = 'Verbindung zum Server getrennt'

const NAV_PANEL_ID = 'admin-nav-panel'
const DASHBOARD_ID = 'admin-dashboard'

interface LayoutProps {
  $isPanelOpen: boolean
  $isDashboardOpen: boolean
}

// Dashboard one third of the width of notes and dashboard (between DASHBOARD_MIN_WIDTH and
// DASHBOARD_MAX_WIDTH), the notes the rest; without the dashboard the notes take all of it
const screenColumns = ({ $isPanelOpen, $isDashboardOpen }: LayoutProps, gap: string): string => {
  const panel = $isPanelOpen ? ` ${LEFT_COLUMN_WIDTH}` : ''
  if (!$isDashboardOpen) {
    return `${NAV_RAIL_WIDTH}${panel} minmax(0, 1fr)`
  }
  const besideContent = $isPanelOpen
    ? `${NAV_RAIL_WIDTH} - ${LEFT_COLUMN_WIDTH} - 2 * ${gap}`
    : `${NAV_RAIL_WIDTH} - ${gap}`
  const third = `calc((100% - ${besideContent} - ${gap}) / 3)`
  return `${NAV_RAIL_WIDTH}${panel} minmax(0, 1fr) `
    + `clamp(${DASHBOARD_MIN_WIDTH}, ${third}, ${DASHBOARD_MAX_WIDTH})`
}

const screenAreas = ({ $isPanelOpen, $isDashboardOpen }: LayoutProps): string => {
  const panel = $isPanelOpen ? ' panel' : ''
  const header = $isDashboardOpen ? 'header header' : 'header'
  const content = $isDashboardOpen ? 'notes dashboard' : 'notes'
  return `"rail${panel} ${header}" "rail${panel} ${content}"`
}

// The gap between the rows keeps the space below the header free while notes and dashboard
// scroll; their space at the bottom lies inside the scroll areas, so fully scrolled down the last
// tile ends level with rail and panel
const Screen = styled.div<LayoutProps>`
    display: grid;
    grid-template-columns: ${(props) => screenColumns(props, props.theme.space[5])};
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas: ${(props) => screenAreas(props)};
    gap: ${(props) => props.theme.space[5]};
    padding: 0 ${(props) => props.theme.space[5]};
    position: fixed;
    inset: 0;
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    };
`

// One cell that its child fills, so the scroll areas inside get a definite height
const Area = styled.div<{ $area: string }>`
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    grid-area: ${(props) => props.$area};
    min-width: 0;
    min-height: 0;
`

const RailArea = styled(Area)`
    margin: ${(props) => props.theme.space[5]} 0;
`

const HeaderArea = styled(Area)`
    grid-template: auto / minmax(0, 1fr);
    margin-top: ${(props) => props.theme.space[5]};
`

const NavPanel = styled.div<TileSurfaceProps>`
    ${tileSurface}
    grid-area: panel;
    min-height: 0;
    margin: ${(props) => props.theme.space[5]} 0;
    overflow-y: auto;
    ${hoverScrollbar}
    padding: ${(props) => props.theme.space[5]} ${(props) => props.theme.space[4]};
`

// A write to the API; the screens change only with the push of the server that follows it
type Save = () => Promise<unknown>

function AdminScreen(): ReactElement {
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { activeSceneId } = useContext(ActiveSceneContext)
  const {
    hasState,
    snapshot,
    theme: gameTableTheme,
    wallOverlay,
    groundGrid,
    groundGridCellSize,
    connected,
    reconnectNow,
  } = useContext(GameTableContext)
  const { audio } = useContext(GameAudioContext)
  useAudioPlayback()
  useAutoAudioOutput()
  const isMusicPlaying = audio?.playing ?? false
  const [adventures, setAdventures] = useState<AdventureSummary[]>()
  const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
  const [adventureDetail, setAdventureDetail] = useState<AdventureDetail>()
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
  const [adventureFailed, setAdventureFailed] = useState<boolean>(false)
  const [activeSceneFailed, setActiveSceneFailed] = useState<boolean>(false)
  const hasLoadError = adventuresFailed || adminDataFailed || adventureFailed || activeSceneFailed

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
      setAdventureDetail(undefined)
      setAdventureFailed(false)
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

  // The snapshot does not contain the level: the server pushes one after every write to an
  // adventure, so a new snapshot reloads players and level, also in other Admin windows
  useEffect(() => {
    let stale = false

    if (loadedAdventureId === null) {
      return undefined
    }

    loadLatest(
      () => getAdventure(loadedAdventureId),
      (loaded) => {
        setAdventureDetail(loaded)
        setAdventureFailed(false)
      },
      (err) => {
        console.error('Error fetching adventure:', err)
        setAdventureFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [loadedAdventureId, snapshot, reloadCount])

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

  const handleLevelChange = (level: number) => {
    if (adventureDetail === undefined) {
      return
    }
    const adventureId = adventureDetail.id
    runSave(() => saveGlobalLevel(adventureId, level))
  }

  const handleThemeToggle = () => {
    const nextTheme = gameTableTheme === 'dark' ? 'tavern' : 'dark'
    runSave(() => saveTheme(nextTheme))
  }

  const handleWallOverlayChange = (nextWallOverlay: WallOverlay) => {
    runSave(() => saveWallOverlay(nextWallOverlay))
  }

  const handleGroundGridChange = (nextGroundGrid: GroundGrid) => {
    runSave(() => saveGroundGrid(nextGroundGrid))
  }

  const handleGroundGridCellSizeCommit = (cellSize: number) => {
    runSave(() => saveGroundGridCellSize(cellSize))
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

  const errorNotices = {
    connection: { message: CONNECTION_ERROR_MESSAGE, onRetry: reconnectNow },
    load: { message: LOAD_ERROR_MESSAGE, onRetry: retryLoading },
    save: { message: SAVE_ERROR_MESSAGE, onRetry: retrySaving },
  }
  const shownError = mostImportantError({
    connection: !connected,
    load: hasLoadError,
    save: failedSave !== null,
  })

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

  // The detail of the previous adventure stays until the new one is loaded; meanwhile the
  // background is plain instead of showing the image of the previous adventure
  const background = useAdventureBackground(
    adventureDetail?.id === loadedAdventureId ? adventureDetail : undefined,
    gameTableTheme,
  )
  const isTranslucent = background.isImageShown

  const players = adventureDetail?.players ?? []
  const level = adventureDetail?.global_level ?? null

  return (
    <>
      <GlobalStyle />
      <AdventureBackground
        layers={background.layers}
        shown={background.shown}
        onLoad={background.onLoad}
        onError={background.onError}
      />
      <Dialogue
        sceneOption={sceneOption}
        handleDialogueOption={handleDialogueOption}
        isVisible={dialogueVisibility}
      />
      <Screen $isPanelOpen={openNavItem !== undefined} $isDashboardOpen={isDashboardOpen}>
        <RailArea $area="rail">
          <NavRail
            items={navItems}
            openItemId={openNavItem?.id ?? null}
            panelId={NAV_PANEL_ID}
            onSelect={handleNavSelect}
            isTranslucent={isTranslucent}
          />
        </RailArea>
        {openNavItem && (
          <NavPanel
            id={NAV_PANEL_ID}
            aria-label={openNavItem.name}
            data-test-id="nav-panel"
            $isTranslucent={isTranslucent}
          >
            {openNavItem.panel}
          </NavPanel>
        )}
        <HeaderArea $area="header">
          <AdminHeader
            onToggleTheme={handleThemeToggle}
            adventures={adventures ?? []}
            activeAdventureId={activeAdventureId}
            onSelectAdventure={handleAdventureSelection}
            errorNotice={shownError === null ? null : errorNotices[shownError]}
            isDashboardOpen={isDashboardOpen}
            dashboardId={DASHBOARD_ID}
            onToggleDashboard={() => setIsDashboardOpen((open) => !open)}
            isTranslucent={isTranslucent}
          />
        </HeaderArea>
        <Area $area="notes">
          <DocumentReader selectedStoryIndex={selectedStoryIndex} isTranslucent={isTranslucent} />
        </Area>
        {isDashboardOpen && (
          <Area $area="dashboard">
            <Dashboard id={DASHBOARD_ID}>
              <ActiveScenePanel activeScene={activeScene} testId="dashboard-panel-stage" />
              <DashboardPanel
                label="Audio"
                testId="dashboard-panel-audio"
                isTranslucent={isTranslucent}
              >
                <AudioPanel
                  audio={audio}
                  failedSave={failedSave}
                  onToggleMusic={handleMusicToggle}
                  onVolumeCommit={handleVolumeCommit}
                  onPlaySound={handleSound}
                />
              </DashboardPanel>
              <DashboardPanel
                label="Spieltisch"
                testId="dashboard-panel-table"
                isTranslucent={isTranslucent}
              >
                <GameTablePanel
                  wallOverlay={wallOverlay}
                  groundGrid={groundGrid}
                  groundGridCellSize={groundGridCellSize}
                  failedSave={failedSave}
                  onWallOverlayChange={handleWallOverlayChange}
                  onGroundGridChange={handleGroundGridChange}
                  onGroundGridCellSizeCommit={handleGroundGridCellSizeCommit}
                />
              </DashboardPanel>
              <DashboardPanel
                label="Party"
                title={`Party · ${players.length}`}
                headEnd={<LevelStepper level={level} onChange={handleLevelChange} />}
                testId="dashboard-panel-party"
                isTranslucent={isTranslucent}
              >
                <PlayersPanel players={players} />
              </DashboardPanel>
            </Dashboard>
          </Area>
        )}
      </Screen>
    </>
  )
}

export default AdminScreen
