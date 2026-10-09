import { useCallback, useEffect, useState } from 'react'

import { MusicPlayer } from '../utils/musicPlayer'

export interface MusicPlayerControls {
  track: string | null
  isPlaying: boolean
  setPlaylist: (tracks: string[]) => void
  toggle: () => void
}

const createPlayer = (initialPlaylist: string[]): MusicPlayer => {
  const player = new MusicPlayer()
  player.setPlaylist(initialPlaylist)
  return player
}

export const useMusicPlayer = (initialPlaylist: string[]): MusicPlayerControls => {
  const [player] = useState(() => createPlayer(initialPlaylist))
  const [track, setTrack] = useState<string | null>(player.track)
  const [isPlaying, setIsPlaying] = useState<boolean>(player.isPlaying)

  useEffect(() => {
    const sync = () => {
      setTrack(player.track)
      setIsPlaying(player.isPlaying)
    }
    const unsubscribe = player.subscribe(sync)
    sync()
    return () => {
      unsubscribe()
      player.pause()
    }
  }, [player])

  const setPlaylist = useCallback((tracks: string[]) => player.setPlaylist(tracks), [player])
  const toggle = useCallback(() => {
    void player.toggle()
  }, [player])

  return { track, isPlaying, setPlaylist, toggle }
}
