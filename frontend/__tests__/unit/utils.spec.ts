import { describe, it, expect } from 'vitest'

import data from './SceneDetailMock.json'
import { SceneDetail } from '../../src/models/models'
import { getSceneByMapId } from '../../src/utils/utils'

describe('should return scene by battlemaps_id', () => {
  const SceneDetailMock: SceneDetail[] = data

  it('should return scene', () => {
    const battlemapsId = SceneDetailMock[0].battlemaps_id
    if (battlemapsId !== null) {
      const scene = getSceneByMapId(battlemapsId, SceneDetailMock)
      expect(scene).toBe(SceneDetailMock[0])
    } else {
      throw new Error('battlemaps_id is null')
    }
  })

  it('should return type SceneDetail', () => {
    const battlemapsId = SceneDetailMock[0].battlemaps_id
    if (battlemapsId !== null) {
      const scene = getSceneByMapId(battlemapsId, SceneDetailMock)
      expect(typeof scene).toBe(typeof SceneDetailMock[0])
    } else {
      throw new Error('battlemaps_id is null')
    }
  })

  it('should throw error', () => {
    expect(() => getSceneByMapId(9999, SceneDetailMock)).toThrow(
      'Scene with battlemap id 9999 not found'
    )
  })
})
