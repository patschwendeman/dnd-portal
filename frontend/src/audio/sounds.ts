import { SoundName } from '../models/models'

export interface Sound {
  name: SoundName
  // Paths below public/, served by the frontend itself
  icon: string
  file: string
}

const sound = (name: SoundName, icon: string, file: string): Sound => ({
  name,
  icon: `/assets/icons/${icon}`,
  file: `/assets/sounds/${file}`,
})

// Groups as shown in the dashboard panel "Sounds" of the Admin
export const SOUND_GROUPS: readonly (readonly Sound[])[] = [
  [sound('heal', 'heart.svg', 'heal.wav'), sound('bottle', 'bottle.svg', 'bottle.wav')],
  [
    sound('buff', 'buff.svg', 'buff.wav'),
    sound('music_1', 'music.svg', 'music_1.wav'),
    sound('music_2', 'music_2.svg', 'music_2.wav'),
  ],
  [sound('spell_1', 'bold.svg', 'spell_1.wav'), sound('spell_2', 'star_2.svg', 'spell_2.wav')],
  [sound('debuff_1', 'eye.svg', 'debuff_1.mp3'), sound('debuff_2', 'ghost.svg', 'debuff_2.wav')],
  [sound('lock', 'lock.svg', 'lock.wav')],
]

export const SOUNDS: readonly Sound[] = SOUND_GROUPS.flat()

export const SOUND_NAMES: readonly SoundName[] = SOUNDS.map((item) => item.name)

export const isSoundName = (value: unknown): value is SoundName => (
  SOUND_NAMES.includes(value as SoundName)
)

export const soundFile = (name: SoundName): string | undefined => (
  SOUNDS.find((item) => item.name === name)?.file
)
