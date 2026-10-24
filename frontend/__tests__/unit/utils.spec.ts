import { describe, it, expect } from 'vitest'

import data from './SceneDetailMock.json'
import { SceneDetail } from '../../src/models/models'
import { filterSceneByKey } from '../../src/utils/utils'

describe('should return scene by key', () => {
  const SceneDetailMock: SceneDetail[] = data
  const key = 'id'

  it('should return scene by id', () => {
    const value = SceneDetailMock[0].id
    if (value !== null) {
      const scene = filterSceneByKey(key, value, SceneDetailMock)
      expect(scene).toBe(SceneDetailMock[0])
    } else {
      throw new Error('ID is null')
    }
  })

  it('should return type SceneDetail', () => {
    const value = SceneDetailMock[0].id
    if (value !== null) {
      const scene = filterSceneByKey(key, value, SceneDetailMock)
      expect(typeof scene).toBe(typeof SceneDetailMock[0])
    } else {
      throw new Error('ID is null')
    }
  })

  it('should throw error', () => {
    expect(() => filterSceneByKey(key, 9999, SceneDetailMock)).toThrow(
      `Scene with ${key} 9999 not found`,
    )
  })
})
