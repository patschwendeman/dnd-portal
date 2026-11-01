import { ReactElement } from 'react'
import styled from 'styled-components'

import MusicControl from './MusicControl'
import SoundBoard from './SoundBoard'
import { AudioState, SoundName } from '../models/models'

const Audio = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[4]};
`

const Divider = styled.hr`
  height: ${(props) => props.theme.borderWidth.thin};
  background-color: ${(props) => props.theme.colors.border};
  border: none;
`

interface AudioPanelProps {
  audio: AudioState | null
  failedSave: object | null
  onToggleMusic: () => void
  onVolumeCommit: (volume: number) => void
  onPlaySound: (name: SoundName) => void
}

// Content of the dashboard panel "Audio": music above, sound effects below
function AudioPanel({
  audio, failedSave, onToggleMusic, onVolumeCommit, onPlaySound,
}: AudioPanelProps): ReactElement {
  return (
    <Audio>
      <MusicControl
        audio={audio}
        failedSave={failedSave}
        onToggle={onToggleMusic}
        onVolumeCommit={onVolumeCommit}
      />
      <Divider />
      <SoundBoard onPlaySound={onPlaySound} />
    </Audio>
  )
}

export default AudioPanel
