import { loadData } from '../api/loadData'
import { saveData } from '../api/saveData'
import { AdventureDetail, AdventureSummary, Map, MapResponse, SceneDetail } from '../models/models'

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

export const saveActiveScene = async (adventureId: number, sceneId: number): Promise<AdventureDetail> => {
  // The request body follows the API contract (AdventureUpdate), whose fields are snake_case
  // eslint-disable-next-line camelcase
  return saveData(`active scene of adventure ${adventureId}`, `adventures/${adventureId}`, { active_scene_id: sceneId })
}

export const handleDialogue = (
  option: boolean,
  sceneOption: SceneDetail | undefined,
  setActiveSceneId: React.Dispatch<React.SetStateAction<number | null>>,
  setDialogueVisibility: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (option === true) {
    if (!sceneOption) {
      throw new Error('Scene option not found')
    }
    setActiveSceneId(sceneOption.id)
  }
  setDialogueVisibility(false)
}
