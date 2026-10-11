import { loadData } from '../api/loadData'
import { Map, MapResponse } from '../models/models'

export const getWallScreenData = async (id: number) => {
  const sceneDetail = await loadData('scene detail', `scenes/${id}`)
  const mainmaps = await loadData('main maps', 'maps/main')
  const toMap = ({ id, source }: MapResponse): Map => ({ sceneId: id, source })
  return [sceneDetail, mainmaps.map(toMap)]
}
