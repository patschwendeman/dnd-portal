import { SceneDetail } from '../models/models'

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

export const getMusicTitle = (source: string): string => {
  const fileName = source.split('/').pop() ?? ''
  const withoutExtension = fileName.replace(/\.[^.]+$/, '')
  const withoutHash = withoutExtension.replace(/-[A-Za-z0-9_-]{8}$/, '')
  return withoutHash.replace(/_/g, ' ').trim()
}
