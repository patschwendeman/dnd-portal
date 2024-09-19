import { getData } from '../api/apiMethods'

export const getWallScreenData = async (id: number) => {
    const sceneDetail = await getData(`scenes/details/${id}`)
    const battlemaps = await getData('maps/battlemaps/', { players: true })
    if (!sceneDetail) {
      throw new Error('scene detail not found')
    }
    if (!battlemaps) {
      throw new Error('Battlemaps not found')
    }
    return [sceneDetail, battlemaps]
  }