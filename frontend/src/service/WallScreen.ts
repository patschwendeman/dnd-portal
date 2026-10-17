import { loadData } from '../api/loadData'
import { Map, MapResponse, SceneDetail } from '../models/models'

export const getWallScene = async (sceneId: number): Promise<SceneDetail> => {
  return loadData('scene detail', `scenes/${sceneId}`)
}

export const getWallMainmaps = async (adventureId: number): Promise<Map[]> => {
  const mainmaps: MapResponse[] = await loadData('main maps', `adventures/${adventureId}/maps/main`)
  return mainmaps.map(({ id, source }): Map => ({ sceneId: id, source }))
}
