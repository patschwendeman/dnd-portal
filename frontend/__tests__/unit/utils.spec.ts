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
