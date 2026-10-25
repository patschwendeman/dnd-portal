import { useContext, useEffect } from 'react'

import shouldRequestAudioOutput from './audioOutput'
import { GameAudioContext } from '../context/context'

// Browsers allow playback only after a user interaction in the window; these events count as one
const INTERACTION_EVENTS = ['pointerdown', 'keydown'] as const

const useAutoAudioOutput = (): void => {
  const { audio, isAudioOutput, requestAudioOutput } = useContext(GameAudioContext)

  useEffect(() => {
    if (!shouldRequestAudioOutput(audio, isAudioOutput)) {
      return undefined
    }
    const handleInteraction = (): void => requestAudioOutput()
    // Capture phase, so no element that stops the event keeps the window from becoming the output
    INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, handleInteraction, true))
    return () => {
      INTERACTION_EVENTS.forEach(
        (type) => window.removeEventListener(type, handleInteraction, true),
      )
    }
  }, [audio, isAudioOutput, requestAudioOutput])
}

export default useAutoAudioOutput
