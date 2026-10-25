import { useContext, useEffect, useState } from 'react'

import { AudioPlayer } from './audioPlayer'
import { GameAudioContext } from '../context/context'

const useAudioPlayback = (): void => {
  const {
    audio, isAudioOutput, reportTrackEnded, subscribeSound,
  } = useContext(GameAudioContext)
  const [audioPlayer, setAudioPlayer] = useState<AudioPlayer | null>(null)

  useEffect(() => {
    const player = new AudioPlayer({ onTrackEnded: reportTrackEnded })
    // The player owns audio elements that the cleanup releases, so it is created in the effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAudioPlayer(player)
    return () => {
      player.dispose()
    }
  }, [reportTrackEnded])

  useEffect(() => {
    audioPlayer?.update(audio, isAudioOutput)
  }, [audioPlayer, audio, isAudioOutput])

  useEffect(() => {
    if (audioPlayer === null) {
      return undefined
    }
    return subscribeSound((name) => audioPlayer.playSound(name))
  }, [audioPlayer, subscribeSound])
}

export default useAudioPlayback
