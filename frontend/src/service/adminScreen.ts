import { getData } from '../api/apiMethods'
import { SceneDetail } from '../models/models'

export const getAdminData = async () => {
  const sidemaps = await getData('maps/side/')
  const mainmaps = await getData('maps/main/', { players: false })
  const scenesDetails = await getData('scenes/details/')
  if (!sidemaps) {
    throw new Error('Sidemaps not found')
  }
  if (!mainmaps) {
    throw new Error('Mainmaps not found')
  }
  if (!scenesDetails) {
    throw new Error('Scenes details not found')
  }
  return [sidemaps, mainmaps, scenesDetails]
}

export const getSceneById = async (id: number) => {
  const sceneDetail = await getData(`scenes/details/${id}`)
  if (!sceneDetail) {
    throw new Error(`Scene detail by id ${id} not found`)
  }
  return sceneDetail
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
