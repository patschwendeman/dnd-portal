import { SceneDetail } from '../models/models'

const isSourcePropertyValid = (obj: unknown): obj is { source: string } => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'source' in obj &&
    typeof (obj as { source: string }).source === 'string'
  )
}

export const filterSceneByKey = <K extends keyof SceneDetail>(
  key: K,
  value: SceneDetail[K],
  sceneDetails: SceneDetail[]
): SceneDetail => {
  const scene = sceneDetails.find((scene) => scene[key] === value)
  if (!scene) {
    throw new Error(`Scene with ${String(key)} ${value} not found`)
  }
  return scene
}

export const getMediaSRC = <K extends keyof SceneDetail>(
  scene: SceneDetail,
  key: K
): string => {
  const value = scene[key]

  if (!isSourcePropertyValid(value)) {
    throw new Error(
      `Source of ${key} not found or does not have a 'source' property`
    )
  }
  return value.source
}
