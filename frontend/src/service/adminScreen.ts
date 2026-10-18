import { loadData } from '../api/loadData'
import { postCommand, saveData } from '../api/saveData'
import {
  AdventureDetail,
  AdventureSummary,
  AudioState,
  AudioUpdate,
  GameTableState,
  Map,
  MapResponse,
  SoundName,
  Theme,
} from '../models/models'

export const getAdventures = async (): Promise<AdventureSummary[]> => {
  return loadData('adventures', 'adventures')
}

export const getAdventure = async (id: number): Promise<AdventureDetail> => {
  return loadData(`adventure ${id}`, `adventures/${id}`)
}

export const getAdminData = async (adventureId: number) => {
  const sidemaps = await loadData('sidemaps', `adventures/${adventureId}/maps/side`)
  const mainmaps = await loadData('mainmaps', `adventures/${adventureId}/maps/main`)
  const scenesDetails = await loadData('scenes details', `adventures/${adventureId}/scenes`)
  const toMap = ({ id, source }: MapResponse): Map => ({ sceneId: id, source })
  return [sidemaps.map(toMap), mainmaps.map(toMap), scenesDetails]
}

export const getSceneById = async (id: number) => {
  return loadData(`scene detail by id ${id}`, `scenes/${id}`)
}

// Request bodies follow the API contract (AdventureUpdate, GameTableUpdate), whose fields are snake_case

export const saveActiveScene = async (adventureId: number, sceneId: number): Promise<AdventureDetail> => {
  // eslint-disable-next-line camelcase
  return saveData(`active scene of adventure ${adventureId}`, `adventures/${adventureId}`, { active_scene_id: sceneId })
}

export const saveActiveAdventure = async (adventureId: number): Promise<GameTableState> => {
  // eslint-disable-next-line camelcase
  return saveData('active adventure', 'table', { active_adventure_id: adventureId })
}

export const saveTheme = async (theme: Theme): Promise<GameTableState> => {
  return saveData('theme', 'table', { theme })
}

// Music and sound effects play on the Wall that is the audio output; the Admin only sends commands

export const saveAudio = async (update: AudioUpdate): Promise<AudioState> => {
  return saveData('music', 'table/audio', update)
}

export const playSound = async (name: SoundName): Promise<void> => {
  await postCommand(`sound ${name}`, 'table/sounds', { name })
}
