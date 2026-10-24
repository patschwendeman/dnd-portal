import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { SideBarLeftElement } from './SideBarLeftElement'
import { ActiveSceneContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { textStyle } from '../style/tokens'

const Navigation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => props.theme.space[1]};
`

const ScenesLabel = styled(Label)`
  padding: 0 ${(props) => props.theme.space[3]} ${(props) => props.theme.space[2]};
`

const EmptyHint = styled.p`
  padding: 0 ${(props) => props.theme.space[3]};
  ${textStyle('sm')}
`

interface SceneNavigationProps {
  // In the order of the API (as created), not sorted again
  scenes: SceneDetail[]
  onSelectScene: (sceneId: number) => void
}

const SceneNavigation: FunctionComponent<SceneNavigationProps> = ({ scenes, onSelectScene }): ReactElement => {
  const { activeSceneId } = useContext(ActiveSceneContext)

  return (
    <Navigation data-test-id="scene-navigation">
      <ScenesLabel>Szenen</ScenesLabel>
      {scenes.length === 0 && <EmptyHint data-test-id="scenes-empty">Keine Szenen</EmptyHint>}
      {scenes.map((scene) => (
        <SideBarLeftElement
          key={scene.id}
          name={scene.name}
          isActive={scene.id === activeSceneId}
          onSelect={() => onSelectScene(scene.id)}
          testId={`scene-entry-${scene.id}`}
        />
      ))}
    </Navigation>
  )
}

export { SceneNavigation }
