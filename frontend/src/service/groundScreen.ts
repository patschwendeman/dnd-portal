import { getData } from '../api/apiMethods'
import { SceneDetail } from '../models/models'

export const getGroundScreenData = async (id: number) => {
  const sceneDetails: SceneDetail = await getData(`scenes/details/${id}`)
  if (!sceneDetails) {
    throw new Error('Scene detail not found')
  }
  return sceneDetails
}
