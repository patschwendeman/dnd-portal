import { SceneDetail } from '../models/models'

export const getSceneByMapId = (
  mapId: number,
  sceneDetails: SceneDetail[]
): SceneDetail => {
  const scene = sceneDetails.find((scene) => scene.battlemaps_id === mapId)
  if (!scene) {
    throw new Error(`Scene with battlemap id ${mapId} not found`)
  }
  return scene
}

export const getSceneById = (
  id: number,
  scenes: SceneDetail[]
): SceneDetail => {
  const scene = scenes.find((scene) => scene.id === id)
  if (!scene) {
    throw new Error(`Scene with id ${id} not found`)
  }
  return scene
}
