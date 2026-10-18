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

export interface GridLayout {
  columns: number
  rows: number
}

// Nearly square grid for any number of maps, filled row by row; the last row may be incomplete
export const getGridLayout = (count: number): GridLayout => {
  if (count <= 0) {
    return { columns: 0, rows: 0 }
  }
  const columns = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / columns)
  return { columns, rows }
}

export const getMusicTitle = (source: string): string => {
  const fileName = source.split('/').pop() ?? ''
  const withoutExtension = fileName.replace(/\.[^.]+$/, '')
  const withoutHash = withoutExtension.replace(/-[A-Za-z0-9_-]{8}$/, '')
  return withoutHash.replace(/_/g, ' ').trim()
}
