import { loadData } from '../api/loadData'
import { SceneDetail } from '../models/models'

const getGroundScreenData = async (id: number) => {
  const sceneDetails: SceneDetail = await loadData('scene detail', `scenes/${id}`)
  return sceneDetails
}

export default getGroundScreenData
