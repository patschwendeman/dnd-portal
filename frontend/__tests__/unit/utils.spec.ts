import { describe, it, expect } from 'vitest'

import data from './SceneDetailMock.json'
import { SceneDetail } from '../../src/models/models'
import { filterSceneByKey, getRandomTrack } from '../../src/utils/utils'

function getRandomNumber(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

describe('should return scene by key', () => {
  const SceneDetailMock: SceneDetail[] = data
  const key = 'graphics_ground_id'

  it('should return scene by graphics_ground_id', () => {
    const value = SceneDetailMock[0].graphics_ground.id
    if (value !== null) {
      const scene = filterSceneByKey(key, value, SceneDetailMock)
      expect(scene).toBe(SceneDetailMock[0])
    } else {
      throw new Error('ID is null')
    }
  })

  it('should return type SceneDetail', () => {
    const value = SceneDetailMock[0].graphics_ground.id
    if (value !== null) {
      const scene = filterSceneByKey(key, value, SceneDetailMock)
      expect(typeof scene).toBe(typeof SceneDetailMock[0])
    } else {
      throw new Error('ID is null')
    }
  })

  it('should throw error', () => {
    expect(() => filterSceneByKey(key, 9999, SceneDetailMock)).toThrow(
      'Scene with ' + key + ' 9999 not found'
    )
  })
})

describe('should return random track from playlist', () => {
  const playlist = [
    'examplePlaylist_1',
    'examplePlaylist_2',
    'examplePlaylist_3',
    'examplePlaylist_4',
    'examplePlaylist_5',
  ]

  const randomNumber = getRandomNumber(1, 25)
  const lastTrack = playlist[randomNumber]
  const randomTrack = getRandomTrack(playlist, lastTrack)

  it('should return a track', () => {
    expect(randomTrack).toBeDefined()
  })
  it('should return a different track to last track', () => {
    expect(randomTrack).not.toBe(lastTrack)
  })
})
