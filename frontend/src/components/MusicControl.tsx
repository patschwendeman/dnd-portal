import { ReactElement, useState } from 'react'
import { ReactSVG } from 'react-svg'
import styled, { useTheme } from 'styled-components'

import { PanelSlider, PanelSliderArea, SliderValue } from './PanelSlider'
import { AudioState } from '../models/models'
import { textStyle } from '../style/tokens'
import { getMusicTitle } from '../utils/utils'

import pauseIcon from '/assets/icons/pause.svg'
import playIcon from '/assets/icons/play.svg'
import volumeIcon from '/assets/icons/volume.svg'

const NO_AUDIO_OUTPUT_MESSAGE = 'Keine Audioausgabe bereit'

const Music = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.theme.space[4]};
    min-width: 0;
`

const NowPlaying = styled.div`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: ${(props) => props.theme.space[3]};
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

// Title and state wrap instead of being cut off; long German words are hyphenated (lang="de" on
// the element)
const Track = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: break-word;
    hyphens: auto;
`

const TrackName = styled.span`
    ${textStyle('sm')}
    font-weight: ${(props) => props.theme.fontWeight.medium};
`

const TrackState = styled.span`
    ${textStyle('sm')}
`

const Volume = styled.div`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: ${(props) => props.theme.space[3]};

    svg {
      display: block;
      width: ${(props) => props.theme.size.icon};
      height: ${(props) => props.theme.size.icon};
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

const trackState = (audio: AudioState): string => {
  if (!audio.output_ready) {
    return NO_AUDIO_OUTPUT_MESSAGE
  }
  return audio.playing ? 'Läuft' : 'Pausiert'
}

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

  const shownVolume = draggedVolume ?? audio?.volume ?? 0

  return (
    <Music>
      <NowPlaying>
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
          {audio !== null && (
            <TrackState
              data-test-id={audio.output_ready ? 'music-state' : 'music-no-output'}
            >
              { trackState(audio) }
            </TrackState>
          )}
        </Track>
      </NowPlaying>
      <Volume>
        <ReactSVG
          src={volumeIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.text.muted}`)
            svg.setAttribute('aria-hidden', 'true')
          }}
        />
        <PanelSliderArea>
          <PanelSlider
            aria-label="Lautstärke"
            value={shownVolume}
            onChange={(_event, value) => setDraggedVolume(value as number)}
            onChangeCommitted={(_event, value) => onVolumeCommit(value as number)}
            min={0}
            max={100}
          />
        </PanelSliderArea>
        <SliderValue data-test-id="music-volume-value">{shownVolume}</SliderValue>
      </Volume>
    </Music>
  )
}

export default MusicControl
