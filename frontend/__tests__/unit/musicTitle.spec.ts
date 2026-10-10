import { describe, it, expect } from 'vitest'

import { getMusicTitle } from '../../src/utils/utils'

describe('getMusicTitle', () => {
  it('should derive the title from a path with underscores', () => {
    expect(getMusicTitle('/assets/music/side/forest/From_Past_To_Present.mp3')).toBe('From Past To Present')
  })

  it('should remove a hash appended by vite', () => {
    expect(getMusicTitle('/assets/From_Past_To_Present-BsdzwqO1.mp3')).toBe('From Past To Present')
  })

  it('should remove a vite hash containing underscores and dashes', () => {
    expect(getMusicTitle('/assets/City_Gates-a_B-9xYz.mp3')).toBe('City Gates')
  })

  it('should keep a file name without underscores', () => {
    expect(getMusicTitle('/assets/music/main/boss/fight.mp3')).toBe('fight')
  })

  it('should return an empty string for an empty source', () => {
    expect(getMusicTitle('')).toBe('')
  })
})
