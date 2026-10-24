import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, it, expect } from 'vitest'

import {
  isSoundName, SOUND_GROUPS, SOUND_NAMES, soundFile, SOUNDS,
} from '../../src/audio/sounds'

const FRONTEND_DIR = resolve(__dirname, '../..')

const contractSoundNames = (): string[] => {
  const openapi = JSON.parse(
    readFileSync(resolve(FRONTEND_DIR, '../backend/openapi.json'), 'utf-8'),
  )
  return openapi.components.schemas.SoundRequest.properties.name.enum
}

describe('sound list', () => {
  it('has exactly the names of the API contract, each once', () => {
    expect([...SOUND_NAMES].sort()).toEqual([...contractSoundNames()].sort())
    expect(new Set(SOUND_NAMES).size).toBe(SOUND_NAMES.length)
  })

  it('keeps the groups of the TopBar', () => {
    expect(SOUND_GROUPS.map((group) => group.map((sound) => sound.name))).toEqual([
      ['heal', 'bottle'],
      ['buff', 'music_1', 'music_2'],
      ['spell_1', 'spell_2'],
      ['debuff_1', 'debuff_2'],
      ['lock'],
    ])
  })

  it('points to existing files in public/', () => {
    SOUNDS.forEach((sound) => {
      expect(existsSync(resolve(FRONTEND_DIR, 'public', `.${sound.icon}`)), sound.icon).toBe(true)
      expect(existsSync(resolve(FRONTEND_DIR, 'public', `.${sound.file}`)), sound.file).toBe(true)
    })
  })

  it('resolves names to files and recognizes only known names', () => {
    expect(soundFile('debuff_1')).toBe('/assets/sounds/debuff_1.mp3')
    expect(isSoundName('heal')).toBe(true)
    expect(isSoundName('explosion')).toBe(false)
    expect(isSoundName(undefined)).toBe(false)
  })
})
