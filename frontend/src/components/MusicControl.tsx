import Box from '@mui/material/Box'
import { ReactElement, useState } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import { PANEL_SLIDER_THUMB_SIZE, PanelSlider } from './PanelSlider'
import { TextButton } from './TextButton'
import { AudioState } from '../models/models'
import { textStyle } from '../style/tokens'
import { getMusicTitle } from '../utils/utils'

import pauseIcon from '/assets/icons/pause.svg'
import playIcon from '/assets/icons/play.svg'

// Lowest height of the vertical slider; in the panel it takes the full height of the content
const VOLUME_SLIDER_MIN_HEIGHT = '96px'

const NO_AUDIO_OUTPUT_MESSAGE = 'Keine Audioausgabe bereit'

const Music = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
        "toggle volume"
        "track volume"
        "output output";
    gap: ${(props) => props.theme.space[3]};
    height: 100%;
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
    grid-area: toggle;
    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
    }
`

// The panel is narrow: title and hint wrap instead of being cut off; long German words are
// hyphenated (lang="de" on the element)
const Track = styled.div`
    display: flex;
    flex-direction: column;
    grid-area: track;
    min-width: 0;
    overflow-wrap: break-word;
    hyphens: auto;
`

const TrackName = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
`

const AudioHint = styled.span`
    ${textStyle('sm')}
`

// Pressed while this window plays the music; inactive in the panel area `background`
const OutputButton = styled(TextButton)`
    grid-area: output;
    justify-self: start;
    white-space: nowrap;
    &:focus-visible {
      outline: ${(props) => props.theme.borderWidth.thick} solid
        ${(props) => props.theme.colors.primary};
      outline-offset: ${(props) => props.theme.borderWidth.thick};
    }
`

interface MusicControlProps {
  // null until the first audio state of the server arrived
  audio: AudioState | null
  // The last failed write; a new one ends a drag of the slider like a new audio state
  failedSave: object | null
  onToggle: () => void
  onVolumeCommit: (volume: number) => void
  // Whether this Admin window is the audio output
  isAudioOutput: boolean
  onRequestAudioOutput: () => void
}

// Controls the music on the server; it plays in the Admin window that is the audio output
function MusicControl({
  audio, failedSave, onToggle, onVolumeCommit, isAudioOutput, onRequestAudioOutput,
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
      <Track lang="de">
        <TrackName data-test-id="music-track">
          { getMusicTitle(audio?.track?.source ?? '') }
        </TrackName>
        {audio !== null && !audio.output_ready && (
          <AudioHint data-test-id="music-no-output">{ NO_AUDIO_OUTPUT_MESSAGE }</AudioHint>
        )}
      </Track>
      {/* The click is the user interaction the browser needs to allow playback */}
      <OutputButton
        type="button"
        $variant={isAudioOutput ? 'active' : 'cancel'}
        aria-pressed={isAudioOutput}
        data-test-id="music-output"
        onClick={() => !isAudioOutput && onRequestAudioOutput()}
      >
        Hier abspielen
      </OutputButton>
      {/* Half a thumb above and below, so the thumb stays inside the panel at 0 and 100; the
          invisible touch area around the thumb is cut off instead of overflowing the panel */}
      <Box sx={{
        gridArea: 'volume',
        minHeight: VOLUME_SLIDER_MIN_HEIGHT,
        margin: 0,
        paddingBlock: `calc(${PANEL_SLIDER_THUMB_SIZE} / 2)`,
        overflow: 'hidden',
      }}
      >
        <PanelSlider
          aria-label="Lautstärke"
          orientation="vertical"
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
