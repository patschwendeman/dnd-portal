import { describe, it, expect } from 'vitest'

import data from './SceneDetailMock.json'
import { SceneDetail } from '../../src/models/models'
import { filterSceneByKey } from '../../src/utils/utils'

describe('should return scene by key', () => {
  const SceneDetailMock: SceneDetail[] = data
  const battlemapKey = 'battlemaps_id'

  it('should return scene by battlemap id', () => {
    const battlemapsId = SceneDetailMock[0].battlemaps_id
    if (battlemapsId !== null) {
      const scene = filterSceneByKey(
        battlemapKey,
        battlemapsId,
        SceneDetailMock
      )
      expect(scene).toBe(SceneDetailMock[0])
    } else {
      throw new Error('battlemaps_id is null')
    }
  })

  it('should return type SceneDetail', () => {
    const battlemapsId = SceneDetailMock[0].battlemaps_id
    if (battlemapsId !== null) {
      const scene = filterSceneByKey(
        battlemapKey,
        battlemapsId,
        SceneDetailMock
      )
      expect(typeof scene).toBe(typeof SceneDetailMock[0])
    } else {
      throw new Error('battlemaps_id is null')
    }
  })

  it('should throw error', () => {
    expect(() => filterSceneByKey(battlemapKey, 9999, SceneDetailMock)).toThrow(
      'Scene with ' + battlemapKey + ' 9999 not found'
    )
  })
})
