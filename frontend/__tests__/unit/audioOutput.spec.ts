import { describe, it, expect } from 'vitest'

import shouldRequestAudioOutput from '../../src/audio/audioOutput'
import { AudioState } from '../../src/models/models'

const audio = (outputReady: boolean): AudioState => ({
  playing: false, track: null, volume: 10, output_ready: outputReady,
})

describe('shouldRequestAudioOutput', () => {
  it('requests the output when no Admin is the output', () => {
    expect(shouldRequestAudioOutput(audio(false), false)).toBe(true)
  })

  it('does not take over when another Admin is the output', () => {
    expect(shouldRequestAudioOutput(audio(true), false)).toBe(false)
  })

  it('does not request again when this window is the output', () => {
    expect(shouldRequestAudioOutput(audio(true), true)).toBe(false)
  })

  it('does not request before the first audio state of the server', () => {
    expect(shouldRequestAudioOutput(null, false)).toBe(false)
  })
})
