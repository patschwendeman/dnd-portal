import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import { ReactElement, useState } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import { AudioState } from '../models/models'
import { textStyle } from '../style/tokens'
import { getMusicTitle } from '../utils/utils'

import pauseIcon from '/assets/icons/pause.svg'
import playIcon from '/assets/icons/play.svg'

const VOLUME_SLIDER_WIDTH = '120px'
const VOLUME_SLIDER_THUMB_SIZE = '16px'

const NO_AUDIO_OUTPUT_MESSAGE = 'Keine Audioausgabe bereit'

const Music = styled.div`
    display: flex;
    align-items: center;
    gap: ${(props) => props.theme.space[3]};
    min-width: 0;
`

const AudioControlButton = styled.div<{ $isMusicPlaying: boolean }>`
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: ${(props) => props.theme.size.control.md};
    height: ${(props) => props.theme.size.control.md};
    padding: 0;
    background-color: ${(props) => (
      props.$isMusicPlaying ? props.theme.colors.primary : props.theme.colors.background
    )};
    color: ${(props) => props.theme.colors.text.color};
    border: none;
    border-radius: ${(props) => props.theme.radius.md};
    cursor: pointer;
    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
`

const Track = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
`

const TrackName = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const AudioHint = styled.span`
    ${textStyle('sm')}
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const VolumeSlider = styled(Slider)`
  & .MuiSlider-thumb {
    width: ${VOLUME_SLIDER_THUMB_SIZE};
    height: ${VOLUME_SLIDER_THUMB_SIZE};
    background-color: ${(props) => props.theme.colors.text.color};
    &:focus,
    &:hover,
    &:active {
      box-shadow: none;
    }
  }
  & .MuiSlider-rail {
    background-color: ${(props) => props.theme.colors.background};
    border-radius: ${(props) => props.theme.radius.pill};
  }
  & .MuiSlider-track {
    background-color: ${(props) => props.theme.colors.primary};
    border: none;
  }
`

interface MusicControlProps {
  // null until the first audio state of the server arrived
  audio: AudioState | null
  // The last failed write; a new one ends a drag of the slider like a new audio state
  failedSave: object | null
  onToggle: () => void
  onVolumeCommit: (volume: number) => void
}

// Remote control of the music played by the Wall: the Admin plays nothing itself
function MusicControl({
  audio, failedSave, onToggle, onVolumeCommit,
}: MusicControlProps): ReactElement {
  const theme = useTheme()
  const isMusicPlaying = audio?.playing ?? false
  // Only while the slider is dragged; afterwards it shows the volume pushed by the server
  const [draggedVolume, setDraggedVolume] = useState<number | null>(null)

  // A new audio state or a failed write ends the drag, so the slider shows the server's volume
  const [prevVolumeSource, setPrevVolumeSource] = useState({ audio, failedSave })
  if (prevVolumeSource.audio !== audio || prevVolumeSource.failedSave !== failedSave) {
    setPrevVolumeSource({ audio, failedSave })
    setDraggedVolume(null)
  }

  return (
    <Music>
      <AudioControlButton
        $isMusicPlaying={isMusicPlaying}
        onClick={onToggle}
        data-test-id="music-toggle"
        data-playing={isMusicPlaying}
      >
        <ReactSVG
          src={isMusicPlaying ? pauseIcon : playIcon}
          beforeInjection={(svg) => {
            const fill = isMusicPlaying ? theme.colors.onPrimary : theme.colors.text.color
            svg.setAttribute('style', `fill: ${fill}`)
          }}
        />
      </AudioControlButton>
      <Track>
        <TrackName data-test-id="music-track">
          { getMusicTitle(audio?.track?.source ?? '') }
        </TrackName>
        {audio !== null && !audio.output_ready && (
          <AudioHint data-test-id="music-no-output">{ NO_AUDIO_OUTPUT_MESSAGE }</AudioHint>
        )}
      </Track>
      <Box sx={{ width: VOLUME_SLIDER_WIDTH, margin: 0, flexShrink: 0 }}>
        <VolumeSlider
          aria-label="Lautstärke"
          value={draggedVolume ?? audio?.volume ?? 0}
          onChange={(_event, value) => setDraggedVolume(value as number)}
          onChangeCommitted={(_event, value) => onVolumeCommit(value as number)}
          min={0}
          max={100}
        />
      </Box>
    </Music>
  )
}

export default MusicControl
