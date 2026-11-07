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
import ConfirmDialog from '../components/ConfirmDialog'
import Dashboard from '../components/Dashboard'
import DashboardPanel from '../components/DashboardPanel'
import Dialogue from '../components/Dialogue'
import DocumentNavigation from '../components/DocumentNavigation'
import DocumentReader from '../components/DocumentReader'
import FightPanel from '../components/FightPanel'
import GameTablePanel from '../components/GameTablePanel'
import InitiativePanel from '../components/InitiativePanel'
import Label from '../components/Label'
import LevelStepper from '../components/LevelStepper'
import { NavRail, NavRailItem } from '../components/NavRail'
import PlayersPanel from '../components/PlayersPanel'
import SceneNavigation from '../components/SceneNavigation'
import SettingsPanel from '../components/SettingsPanel'
import TurnPanel from '../components/TurnPanel'
import {
  ActiveAdventureContext,
  ActiveSceneContext,
  FightContext,
  GameAudioContext,
  GameTableContext,
} from '../context/context'
import {
  AdventureDetail,
  AdventureSummary,
  Combatant,
  GroundGrid,
  Player,
  SceneDetail,
  SoundName,
  Theme,
  WallOverlay,
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
import {
  addCombatant,
  endFight,
  endTurn,
  removeCombatant,
  saveDefeated,
  saveFightOrder,
  startFight,
} from '../service/fight'
import { HistoryStep } from '../notes/historyShortcuts'
import { useHistoryShortcuts, useNoteHistory } from '../notes/useNoteHistory'
import { saveGroundGrid, saveGroundGridCellSize, saveWallOverlay } from '../service/gameTable'
import { textStyle } from '../style/tokens'
import GlobalStyle, { hoverScrollbar, tileSurface, TileSurfaceProps } from '../style/GlobalStyle'
import mostImportantError from '../utils/adminError'
import selectDefaultAdventureId from '../utils/adventure'
import {
  countByKind,
  FightRow,
  moveItem,
  NpcKind,
  preparedNpc,
  preparedPlayer,
  toCombatantCreate,
} from '../utils/fight'
import { loadLatest } from '../utils/loadSafely'
import { nextOpenPanel } from '../utils/navRail'
import { useAdventureBackground } from '../utils/useAdventureBackground'
import useFightPreparation from '../utils/useFightPreparation'
import { filterSceneByKey } from '../utils/utils'

import notesIcon from '/assets/icons/notes.svg'
import scenesIcon from '/assets/icons/scenes.svg'
import settingsIcon from '/assets/icons/settings.svg'
import swordsIcon from '/assets/icons/swords.svg'

// Icon button (size.control.md, 40px) plus space.3 on both sides
const NAV_RAIL_WIDTH = '64px'
const LEFT_COLUMN_WIDTH = '240px'
// Wider, so names and the controls of each combatant fit side by side
const FIGHT_PANEL_WIDTH = '280px'
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
  /** Width of the open panel, null while it is collapsed */
  $panelWidth: string | null
  $isDashboardOpen: boolean
}

// Dashboard one third of the width of notes and dashboard (between DASHBOARD_MIN_WIDTH and
// DASHBOARD_MAX_WIDTH), the notes the rest; without the dashboard the notes take all of it
const screenColumns = ({ $panelWidth, $isDashboardOpen }: LayoutProps, gap: string): string => {
  const panel = $panelWidth !== null ? ` ${$panelWidth}` : ''
  if (!$isDashboardOpen) {
    return `${NAV_RAIL_WIDTH}${panel} minmax(0, 1fr)`
  }
  const besideContent = $panelWidth !== null
    ? `${NAV_RAIL_WIDTH} - ${$panelWidth} - 2 * ${gap}`
    : `${NAV_RAIL_WIDTH} - ${gap}`
  const third = `calc((100% - ${besideContent} - ${gap}) / 3)`
  return `${NAV_RAIL_WIDTH}${panel} minmax(0, 1fr) `
    + `clamp(${DASHBOARD_MIN_WIDTH}, ${third}, ${DASHBOARD_MAX_WIDTH})`
}

const screenAreas = ({ $panelWidth, $isDashboardOpen }: LayoutProps): string => {
  const panel = $panelWidth !== null ? ' panel' : ''
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

const KindCounts = styled.span`
  ${textStyle('sm')}
`

const kindCounts = (combatants: Combatant[]): string => {
  const counts = countByKind(combatants)
  return `Spieler ${counts.player} · Gegner ${counts.enemy} · Verbündete ${counts.ally}`
}

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
  const { fight } = useContext(FightContext)
  const isFighting = fight !== null
  useAudioPlayback()
  useAutoAudioOutput()
  const isMusicPlaying = audio?.playing ?? false
  const [adventures, setAdventures] = useState<AdventureSummary[]>()
  const [scenesDetails, setScenesDetails] = useState<SceneDetail[]>([])
  const [adventureDetail, setAdventureDetail] = useState<AdventureDetail>()
  const [activeScene, setActiveScene] = useState<SceneDetail>()

  const [dialogueVisibility, setDialogueVisibility] = useState<boolean>(false)
  const [sceneOption, setSceneOption] = useState<SceneDetail | undefined>()
  const [isEndFightDialogOpen, setIsEndFightDialogOpen] = useState<boolean>(false)

  // Neither kept on the server nor in localStorage: after a reload the notes panel is open again
  const [openPanel, setOpenPanel] = useState<string | null>('docs')
  const notesScrollRef = useRef<HTMLDivElement>(null)
  const noteHistory = useNoteHistory(notesScrollRef)
  const { back: noteBack, forward: noteForward } = noteHistory
  const handleHistoryStep = useCallback((step: HistoryStep) => {
    if (step === 'back') {
      noteBack()
    } else {
      noteForward()
    }
  }, [noteBack, noteForward])
  useHistoryShortcuts(handleHistoryStep)
  // Not kept either: after a reload the dashboard is shown again
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(true)

  const [adventuresFailed, setAdventuresFailed] = useState<boolean>(false)
  const [adminDataFailed, setAdminDataFailed] = useState<boolean>(false)
  const [adventureFailed, setAdventureFailed] = useState<boolean>(false)
  const [activeSceneFailed, setActiveSceneFailed] = useState<boolean>(false)
  const hasLoadError = adventuresFailed || adminDataFailed || adventureFailed || activeSceneFailed

  // The last write of the Admin that failed, kept so "Erneut versuchen" can repeat it
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
    if (adventureId === activeAdventureId || isFighting) {
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

  const handleThemeChange = (nextTheme: Theme) => {
    if (nextTheme === gameTableTheme) {
      return
    }
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
    if (sceneId === activeSceneId || isFighting) {
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

  const players = adventureDetail?.players ?? []
  const level = adventureDetail?.global_level ?? null

  const [preparation, setPreparation] = useFightPreparation(
    adventureDetail?.id ?? null,
    players,
    isFighting,
  )
  const fightRows: FightRow[] = fight
    ? fight.combatants.map((combatant) => ({ key: `combatant-${combatant.id}`, combatant }))
    : preparation.map((combatant) => ({ key: combatant.key, combatant }))
  const activeFightKey = fight?.active_combatant_id != null
    ? `combatant-${fight.active_combatant_id}`
    : null

  // During the fight every change goes to the server; before it the preparation changes locally
  const handleFightMove = (index: number, step: -1 | 1) => {
    if (fight) {
      const order = moveItem(fight.combatants.map((combatant) => combatant.id), index, step)
      runSave(() => saveFightOrder(order))
    } else {
      setPreparation(moveItem(preparation, index, step))
    }
  }

  const handleFightRemove = (index: number) => {
    if (fight) {
      const combatantId = fight.combatants[index].id
      runSave(() => removeCombatant(combatantId))
    } else {
      setPreparation(preparation.filter((_, i) => i !== index))
    }
  }

  const handleAddNpc = (kind: NpcKind, number: number, label: string) => {
    const npc = preparedNpc(kind, number, label)
    if (fight) {
      runSave(() => addCombatant(toCombatantCreate(npc)))
    } else {
      setPreparation([...preparation, npc])
    }
  }

  const handleAddPlayer = (player: Player) => {
    const prepared = preparedPlayer(player)
    if (fight) {
      runSave(() => addCombatant(toCombatantCreate(prepared)))
    } else {
      setPreparation([...preparation, prepared])
    }
  }

  const handleStartFight = () => {
    const combatants = preparation.map(toCombatantCreate)
    runSave(() => startFight(combatants))
  }

  const handleEndFightDialog = (confirmed: boolean) => {
    setIsEndFightDialogOpen(false)
    if (confirmed) {
      runSave(endFight)
    }
  }

  const handleEndTurn = (combatantId: number) => {
    runSave(() => endTurn(combatantId))
  }

  const handleToggleDefeated = (combatant: Combatant) => {
    runSave(() => saveDefeated(combatant.id, !combatant.defeated))
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

  // Empty while the list of adventures is loading, so "Kein Abenteuer" does not flash up
  const adventureName = activeAdventureId === null
    ? null
    : adventures?.find((adventure) => adventure.id === activeAdventureId)?.name ?? ''

  const navItems: (NavRailItem & { panel: ReactElement })[] = [
    {
      id: 'docs',
      name: 'Notizen',
      icon: notesIcon,
      panel: (
        <DocumentNavigation
          selectedFolderId={noteHistory.entry.folderId}
          onSelectFolder={noteHistory.selectFolder}
        />
      ),
    },
    {
      id: 'scenes',
      name: 'Szenen',
      icon: scenesIcon,
      panel: (
        <SceneNavigation
          scenes={scenesDetails}
          onSelectScene={handleSceneSelection}
          isLocked={isFighting}
        />
      ),
    },
    {
      id: 'fight',
      name: isFighting ? 'Kampf (läuft)' : 'Kampf',
      icon: swordsIcon,
      hasBadge: isFighting,
      panel: (
        <FightPanel
          rows={fightRows}
          players={players}
          isFighting={isFighting}
          round={fight?.round ?? null}
          activeKey={activeFightKey}
          canStart={preparation.length > 0 && activeSceneId !== null}
          onMove={handleFightMove}
          onRemove={handleFightRemove}
          onAddNpc={handleAddNpc}
          onAddPlayer={handleAddPlayer}
          onStart={handleStartFight}
          onEnd={() => setIsEndFightDialogOpen(true)}
        />
      ),
    },
    {
      id: 'settings',
      name: 'Einstellungen',
      icon: settingsIcon,
      placement: 'bottom',
      panel: (
        <SettingsPanel
          adventures={adventures ?? []}
          activeAdventureId={activeAdventureId}
          onSelectAdventure={handleAdventureSelection}
          isAdventureLocked={isFighting}
          isAdventureDisabled={shownError !== null}
          theme={gameTableTheme}
          onThemeChange={handleThemeChange}
          groundGridCellSize={groundGridCellSize}
          failedSave={failedSave}
          onGroundGridCellSizeCommit={handleGroundGridCellSizeCommit}
        />
      ),
    },
  ]
  const openNavItem = navItems.find((item) => item.id === openPanel)
  const openPanelWidth = openNavItem?.id === 'fight' ? FIGHT_PANEL_WIDTH : LEFT_COLUMN_WIDTH
  const panelWidth = openNavItem ? openPanelWidth : null

  const handleNavSelect = (id: string) => {
    setOpenPanel((open) => nextOpenPanel(open, id))
  }

  // The detail of the previous adventure stays until the new one is loaded; meanwhile the
  // background is plain instead of showing the image of the previous adventure
  const background = useAdventureBackground(
    adventureDetail?.id === loadedAdventureId ? adventureDetail : undefined,
  )
  const isTranslucent = background.isImageShown

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
      {isEndFightDialogOpen && (
        <ConfirmDialog
          title="Kampf beenden?"
          text={'Reihenfolge, Runde und Nummern werden verworfen. Szene und Abenteuer lassen sich '
            + 'danach wieder wechseln.'}
          onDecline={() => handleEndFightDialog(false)}
          onConfirm={() => handleEndFightDialog(true)}
          testId="end-fight-dialog"
        />
      )}
      <Screen $panelWidth={panelWidth} $isDashboardOpen={isDashboardOpen}>
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
            canGoBack={noteHistory.canGoBack}
            canGoForward={noteHistory.canGoForward}
            onBack={noteBack}
            onForward={noteForward}
            adventureName={adventureName}
            errorNotice={shownError === null ? null : errorNotices[shownError]}
            isDashboardOpen={isDashboardOpen}
            dashboardId={DASHBOARD_ID}
            onToggleDashboard={() => setIsDashboardOpen((open) => !open)}
            isTranslucent={isTranslucent}
          />
        </HeaderArea>
        <Area $area="notes">
          <DocumentReader
            entry={noteHistory.entry}
            moves={noteHistory.moves}
            scrollRef={notesScrollRef}
            onFollow={noteHistory.follow}
            isTranslucent={isTranslucent}
          />
        </Area>
        {isDashboardOpen && (
          <Area $area="dashboard">
            <Dashboard id={DASHBOARD_ID}>
              {fight ? (
                <>
                  <DashboardPanel
                    label="Am Zug"
                    headEnd={(
                      <Label data-test-id="turn-round">{`Runde ${fight.round}`}</Label>
                    )}
                    testId="dashboard-panel-turn"
                    isTranslucent={isTranslucent}
                  >
                    <TurnPanel
                      combatants={fight.combatants}
                      activeCombatantId={fight.active_combatant_id}
                      round={fight.round}
                      players={players}
                      level={level}
                      onEndTurn={handleEndTurn}
                    />
                  </DashboardPanel>
                  <DashboardPanel
                    label="Initiative"
                    title={`Initiative · ${fight.combatants.length}`}
                    headEnd={<KindCounts>{kindCounts(fight.combatants)}</KindCounts>}
                    testId="dashboard-panel-initiative"
                    isTranslucent={isTranslucent}
                  >
                    <InitiativePanel
                      combatants={fight.combatants}
                      activeCombatantId={fight.active_combatant_id}
                      players={players}
                      onToggleDefeated={handleToggleDefeated}
                    />
                  </DashboardPanel>
                </>
              ) : (
                <ActiveScenePanel activeScene={activeScene} testId="dashboard-panel-stage" />
              )}
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
                  onWallOverlayChange={handleWallOverlayChange}
                  onGroundGridChange={handleGroundGridChange}
                />
              </DashboardPanel>
              {!fight && (
                <DashboardPanel
                  label="Party"
                  title={`Party · ${players.length}`}
                  headEnd={<LevelStepper level={level} onChange={handleLevelChange} />}
                  testId="dashboard-panel-party"
                  isTranslucent={isTranslucent}
                >
                  <PlayersPanel players={players} />
                </DashboardPanel>
              )}
            </Dashboard>
          </Area>
        )}
      </Screen>
    </>
  )
}

export default AdminScreen
