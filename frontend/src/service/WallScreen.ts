import { loadData } from '../api/loadData'
import { SceneDetail } from '../models/models'

const getWallScene = async (sceneId: number): Promise<SceneDetail> => (
  loadData('scene detail', `scenes/${sceneId}`)
)

export default getWallScene
