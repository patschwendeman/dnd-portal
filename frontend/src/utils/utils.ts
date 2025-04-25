import { SceneDetail } from '../models/models'

const isSourcePropertyValid = (obj: unknown): obj is { source: string } => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'source' in obj &&
    typeof (obj as { source: string }).source === 'string'
  )
}

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

export const getMediaSRC = <K extends keyof SceneDetail>(
  scene: SceneDetail,
  key: K
): string => {
  const value = scene[key]

  if (!isSourcePropertyValid(value)) {
    throw new Error(
      `Source of ${key} not found or does not have a 'source' property`
    )
  }
  return value.source
}

export const getRandomTrack = (
  musicPlaylist: string[],
  lastTrack: string
): string => {
  if (musicPlaylist.length <= 1) {
    return musicPlaylist[0]
  }

  let randomIndex = 0

  do {
    randomIndex = Math.floor(Math.random() * musicPlaylist.length)
  } while (musicPlaylist[randomIndex] === lastTrack)

  const selectedTrack = musicPlaylist[randomIndex]
  return selectedTrack
}

export const handleAudio = (
  isMusicPlaying: boolean,
  setLastTrack: React.Dispatch<React.SetStateAction<string>>,
  setActiveMusicSRC: React.Dispatch<React.SetStateAction<string>>,
  musicPlaylist: string[],
  lastTrack: string,
  setAudio: React.Dispatch<React.SetStateAction<HTMLAudioElement | null>>,
  audio: HTMLAudioElement | null
): void => {
  const getNewTrack = () => getRandomTrack(musicPlaylist, lastTrack)

  const randomTrack = getNewTrack()

  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }

  const newAudio = new Audio(randomTrack)
  newAudio.loop = false
  newAudio.volume = 0.1

  newAudio.onended = () => {
    const nextTrack = getNewTrack()
    setActiveMusicSRC(nextTrack)
    setLastTrack(nextTrack)
  }

  setAudio(newAudio)

  if (isMusicPlaying) {
    newAudio.play().catch((err) => {
      throw new Error(`Failed to play new music: ${err}`)
    })
  }
}

export const playAtmoSounds = (track: string) => {
  const newAudio = new Audio(track)
  newAudio.loop = false
  newAudio.volume = 1
  newAudio.play()
}

export const handleAudioControl = (
  audio: HTMLAudioElement | null,
  isMusicPlaying: boolean,
  setIsMusicPlaying: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  if (!audio) {
    return
  }
  if (!isMusicPlaying) {
    audio
      .play()
      .then(() => setIsMusicPlaying(true))
      .catch((err) => {
        throw new Error(`Failed to play new music: ${err}`)
      })
  } else {
    audio.pause()
    setIsMusicPlaying(false)
  }
}
