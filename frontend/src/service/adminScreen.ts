import { loadData } from '../api/loadData'
import { Map, MapResponse, SceneDetail } from '../models/models'

export const getAdminData = async () => {
  const sidemaps = await loadData('sidemaps', 'maps/side/')
  const mainmaps = await loadData('mainmaps', 'maps/main/')
  const scenesDetails = await loadData('scenes details', 'scenes/details/')
  const toMap = ({ id, source }: MapResponse): Map => ({ sceneId: id, source })
  return [sidemaps.map(toMap), mainmaps.map(toMap), scenesDetails]
}

export const getSceneById = async (id: number) => {
  return loadData(`scene detail by id ${id}`, `scenes/details/${id}`)
}

export const handleDialogue = (
  option: boolean,
  sceneOption: SceneDetail | undefined,
  setActiveSceneId: React.Dispatch<React.SetStateAction<number>>,
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
