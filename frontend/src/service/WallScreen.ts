import { loadData } from '../api/loadData'
import { SceneDetail } from '../models/models'

export const getWallScene = async (sceneId: number): Promise<SceneDetail> => loadData('scene detail', `scenes/${sceneId}`)
