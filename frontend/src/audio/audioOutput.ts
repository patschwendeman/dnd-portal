import { AudioState } from '../models/models'

/**
 * Before the first audio state the window does not know whether another Admin is the output, so
 * it waits; an existing output is never taken over by a click
 */
const shouldRequestAudioOutput = (audio: AudioState | null, isAudioOutput: boolean): boolean => (
  audio !== null && !audio.output_ready && !isAudioOutput
)

export default shouldRequestAudioOutput
