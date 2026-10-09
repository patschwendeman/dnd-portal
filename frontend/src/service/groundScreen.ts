import { loadData } from '../api/loadData'
import { SceneDetail } from '../models/models'

export const getGroundScreenData = async (id: number) => {
  const sceneDetails: SceneDetail = await loadData('scene detail', `scenes/details/${id}`)
  return sceneDetails
}
