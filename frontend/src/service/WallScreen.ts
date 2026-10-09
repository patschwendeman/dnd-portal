import { getData } from '../api/apiMethods'
import { Map, MapResponse } from '../models/models'

export const getWallScreenData = async (id: number) => {
  const sceneDetail = await getData(`scenes/details/${id}`)
  const mainmaps = await getData('maps/main/', { players: true })
  if (!sceneDetail) {
    throw new Error('scene detail not found')
  }
  if (!mainmaps) {
    throw new Error('main maps not found')
  }
  const toMap = ({ id, source }: MapResponse): Map => ({ sceneId: id, source })
  return [sceneDetail, mainmaps.map(toMap)]
}
