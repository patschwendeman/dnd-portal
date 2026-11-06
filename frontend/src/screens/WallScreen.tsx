import {
  ReactElement, useContext, useEffect, useState,
} from 'react'
import styled from 'styled-components'

import { mediaUrl } from '../api/mediaUrl'
import FullscreenHoverOverlay from '../components/FullscreenHoverOverlay'
import WallInitiative from '../components/WallInitiative'
import WallJoinPanel from '../components/WallJoinPanel'
import {
  OverlayLayer, OverlayPanel, PanelHeader, PanelTitle,
} from '../components/WallOverlay'
import WallParty from '../components/WallParty'
import {
  ActiveAdventureContext, ActiveSceneContext, FightContext, GameTableContext,
} from '../context/context'
import { Player, SceneDetail } from '../models/models'
import { getWallPlayers, getWallScene } from '../service/WallScreen'
import GlobalStyle from '../style/GlobalStyle'
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
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
    a {
        color: ${(props) => props.theme.colors.primary};
    }
`

// Width: smallest of the upper limit, the viewport minus the side margins and the available height
// (below the same margin as above) converted into a width, so the world map (a single 16:9 image)
// fits completely
const WorldMapPanel = styled(OverlayPanel)`
    width: min(
        ${OVERLAY_PANEL_MAX_WIDTH},
        calc(100vw - 2 * ${(props) => props.theme.space[8]}),
        calc(
            (100vh - 2 * ${(props) => props.theme.space[7]} - 2 *
              ${(props) => props.theme.space[6]}
                - ${(props) => props.theme.text.xl.lineHeight} -
                  ${(props) => props.theme.space[5]}) * 16 / 9
            + 2 * ${(props) => props.theme.space[6]}
        )
    );
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
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { activeSceneId } = useContext(ActiveSceneContext)
  const { wallOverlay } = useContext(GameTableContext)
  const { fight } = useContext(FightContext)
  const [activeScene, setActiveScene] = useState<SceneDetail>()
  const [players, setPlayers] = useState<Player[]>([])

  // Without an active scene the wall shows only the background, no image; reset during render
  // instead of in an effect
  const [prevActiveSceneId, setPrevActiveSceneId] = useState(activeSceneId)
  if (activeSceneId !== prevActiveSceneId) {
    setPrevActiveSceneId(activeSceneId)
    if (activeSceneId === null) {
      setActiveScene(undefined)
    }
  }

  useEffect(() => {
    let stale = false

    if (activeSceneId === null) {
      return undefined
    }

    // Players see no error: the screen keeps the last loaded scene, the next scene change loads
    // again.
    loadLatest(
      () => getWallScene(activeSceneId),
      setActiveScene,
      (err) => console.error('Error fetching wall scene:', err),
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [activeSceneId])

  useEffect(() => {
    let stale = false

    if (activeAdventureId === null) {
      return undefined
    }

    // As with the scene: no error on the Wall, it keeps the last loaded players
    loadLatest(
      () => getWallPlayers(activeAdventureId),
      setPlayers,
      (err) => console.error('Error fetching wall players:', err),
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [activeAdventureId])

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
      {fight !== null && <WallInitiative fight={fight} players={players} />}
      {fight === null && activeSceneId !== null && <WallParty players={players} />}
      <OverlayLayer $isVisible={wallOverlay === 'world'} data-test-id="wall-world-map-layer">
        <WorldMapPanel $isTranslucent data-test-id="wall-world-map">
          <PanelHeader>
            <PanelTitle>Weltkarte</PanelTitle>
          </PanelHeader>
          <MapEnvironment src={MapEnvironmentSrc} alt="" />
        </WorldMapPanel>
      </OverlayLayer>
      <OverlayLayer $isVisible={wallOverlay === 'join'} data-test-id="wall-join-layer">
        {wallOverlay === 'join' && <WallJoinPanel />}
      </OverlayLayer>
      <FullscreenHoverOverlay />
    </Screen>
  )
}
export default WallScreen
