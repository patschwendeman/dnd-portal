import { loadData } from '../api/loadData'
import { postCommand, saveData } from '../api/saveData'
import {
  AdventureDetail,
  AdventureSummary,
  AudioState,
  AudioUpdate,
  GameTableState,
  JoinInfo,
  SceneDetail,
  SoundName,
  Theme,
} from '../models/models'

export const getAdventures = async (): Promise<AdventureSummary[]> => (
  loadData('adventures', 'adventures')
)

export const getAdventure = async (id: number): Promise<AdventureDetail> => (
  loadData(`adventure ${id}`, `adventures/${id}`)
)

export const getAdminData = async (adventureId: number): Promise<SceneDetail[]> => (
  loadData('scenes details', `adventures/${adventureId}/scenes`)
)

export const getJoinInfo = async (): Promise<JoinInfo> => loadData('join info', 'table/join')

export const getSceneById = async (id: number) => (
  loadData(`scene detail by id ${id}`, `scenes/${id}`)
)

// Request bodies follow the API contract (AdventureUpdate, GameTableUpdate), whose fields are
// snake_case

export const saveActiveScene = async (
  adventureId: number,
  sceneId: number,
): Promise<AdventureDetail> => saveData(
  `active scene of adventure ${adventureId}`,
  `adventures/${adventureId}`,
  { active_scene_id: sceneId },
)

export const saveActiveAdventure = async (adventureId: number): Promise<GameTableState> => (
  saveData('active adventure', 'table', { active_adventure_id: adventureId })
)

export const saveTheme = async (theme: Theme): Promise<GameTableState> => (
  saveData('theme', 'table', { theme })
)

export const saveAudio = async (update: AudioUpdate): Promise<AudioState> => (
  saveData('music', 'table/audio', update)
)

export const playSound = async (name: SoundName): Promise<void> => {
  await postCommand(`sound ${name}`, 'table/sounds', { name })
}
