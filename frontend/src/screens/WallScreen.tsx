import {
  ReactElement, useContext, useEffect, useState,
} from 'react'
import styled from 'styled-components'

import { mediaUrl } from '../api/mediaUrl'
import { WallAudioPlayer } from '../audio/wallAudioPlayer'
import { CONTROL_BAR_CLEARANCE, ScreenControlBar } from '../components/ScreenControlBar'
import { ActiveSceneContext, GameAudioContext } from '../context/context'
import { SceneDetail } from '../models/models'
import getWallScene from '../service/WallScreen'
import GlobalStyle from '../style/GlobalStyle'
import { textStyle } from '../style/tokens'
import { loadLatest } from '../utils/loadSafely'
import MapEnvironmentSrc from '../../public/assets/images/ground_screen/mapOverview.jpg'

const OVERLAY_PANEL_MAX_WIDTH = '1440px'

const MapEnvironment = styled.img`
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    border-radius: ${(props) => props.theme.radius.md};
`

const Screen = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: flex-start;
    justify-content: center;
    padding-top: ${(props) => props.theme.space[7]};
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

// Width: smallest of the upper limit, the viewport minus the side margins and the available height
// converted into a width, so the world map (a single 16:9 image) fits completely above the control
// bar
const OverlayPanel = styled.div<{ $isVisible: boolean }>`
    display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
    flex-direction: column;
    align-items: stretch;
    width: min(
        ${OVERLAY_PANEL_MAX_WIDTH},
        calc(100vw - 2 * ${(props) => props.theme.space[8]}),
        calc(
            (100vh - ${(props) => props.theme.space[7]} - ${CONTROL_BAR_CLEARANCE} - 2 *
              ${(props) => props.theme.space[6]}
                - ${(props) => props.theme.text.xl.lineHeight} -
                  ${(props) => props.theme.space[5]}) * 16 / 9
            + 2 * ${(props) => props.theme.space[6]}
        )
    );
    height: auto;
    padding: ${(props) => props.theme.space[6]};
    z-index: ${(props) => props.theme.layer.panel};
    background-color: ${(props) => props.theme.colors.background};
    border-radius: ${(props) => props.theme.radius.lg};
`

const PanelHeader = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: ${(props) => props.theme.space[5]};
`

const PanelTitle = styled.h2`
    ${textStyle('xl')}
    font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const BackgroundImage = styled.img`
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: ${(props) => props.theme.layer.media};
`
function WallScreen(): ReactElement {
  const { activeSceneId } = useContext(ActiveSceneContext)
  const {
    audio, isAudioOutput, requestAudioOutput, reportTrackEnded, subscribeSound,
  } = useContext(GameAudioContext)
  const [audioPlayer, setAudioPlayer] = useState<WallAudioPlayer | null>(null)
  const [activeScene, setActiveScene] = useState<SceneDetail>()
  const [worldMapVisibility, setWorldMapVisibility] = useState<boolean>(false)

  const buttonLabels = ['WORLD', 'OFF']
  const activeButton = worldMapVisibility ? 0 : 1

  const handleMapsVisibility = (option: number) => {
    setWorldMapVisibility(option === 0)
  }

  // Without an active scene the wall shows only the background, no image and no panel; reset
  // during render instead of in an effect
  const [prevActiveSceneId, setPrevActiveSceneId] = useState(activeSceneId)
  if (activeSceneId !== prevActiveSceneId) {
    setPrevActiveSceneId(activeSceneId)
    if (activeSceneId === null) {
      setActiveScene(undefined)
      setWorldMapVisibility(false)
    }
  }

  useEffect(() => {
    let stale = false

    if (activeSceneId === null) {
      return undefined
    }

    const handleWallScene = (scene: SceneDetail) => {
      setActiveScene(scene)
      setWorldMapVisibility(false)
    }

    // Players see no error: the screen keeps the last loaded scene, the next scene change loads
    // again.
    loadLatest(
      () => getWallScene(activeSceneId),
      handleWallScene,
      (err) => console.error('Error fetching wall scene:', err),
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [activeSceneId])

  useEffect(() => {
    const player = new WallAudioPlayer({ onTrackEnded: reportTrackEnded })
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

  return (
    <Screen>
      <GlobalStyle />
      {activeScene && (
        <BackgroundImage
          data-test-id="wallImg"
          src={mediaUrl(activeScene.wall_image.source)}
          alt=""
        />
      )}
      <OverlayPanel $isVisible={worldMapVisibility}>
        <PanelHeader>
          <PanelTitle>Weltkarte</PanelTitle>
        </PanelHeader>
        <MapEnvironment src={MapEnvironmentSrc} alt="" />
      </OverlayPanel>
      <ScreenControlBar
        onVisibilityChange={handleMapsVisibility}
        buttonLabels={buttonLabels}
        activeIndex={activeButton}
        onAudioOutput={requestAudioOutput}
        isAudioOutput={isAudioOutput}
      />
    </Screen>
  )
}
export default WallScreen
