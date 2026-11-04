import { ReactElement, useContext } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

import Label from './Label'
import SideBarLeftElement from './SideBarLeftElement'
import { ActiveSceneContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { textStyle } from '../style/tokens'

import lockIcon from '/assets/icons/padlock.svg'

const Navigation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => props.theme.space[1]};
`

const ScenesLabel = styled(Label)`
  padding: 0 ${(props) => props.theme.space[3]} ${(props) => props.theme.space[2]};
`

const LockHint = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.space[2]};
  margin-bottom: ${(props) => props.theme.space[2]};
  padding: ${(props) => props.theme.space[3]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.md};
  ${textStyle('sm')}

  svg {
    display: block;
    flex: none;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
    color: ${(props) => props.theme.colors.combatant.enemy.text};
  }
`

const EmptyHint = styled.p`
  padding: 0 ${(props) => props.theme.space[3]};
  ${textStyle('sm')}
`

interface SceneNavigationProps {
  // In the order of the API (as created), not sorted again
  scenes: SceneDetail[]
  onSelectScene: (sceneId: number) => void
  // During a fight the scene cannot change: the entries are shown, but do nothing
  isLocked?: boolean
}

function SceneNavigation({
  scenes, onSelectScene, isLocked = false,
}: SceneNavigationProps): ReactElement {
  const { activeSceneId } = useContext(ActiveSceneContext)

  return (
    <Navigation data-test-id="scene-navigation">
      <ScenesLabel>Szenen</ScenesLabel>
      {isLocked && (
        <LockHint data-test-id="scenes-locked">
          <ReactSVG src={lockIcon} wrapper="span" />
          <span>Kampf läuft. Die Szene lässt sich erst nach „Kampf beenden“ wechseln.</span>
        </LockHint>
      )}
      {scenes.length === 0 && <EmptyHint data-test-id="scenes-empty">Keine Szenen</EmptyHint>}
      {scenes.map((scene) => (
        <SideBarLeftElement
          key={scene.id}
          name={scene.name}
          isActive={scene.id === activeSceneId}
          onSelect={() => onSelectScene(scene.id)}
          isDisabled={isLocked}
          testId={`scene-entry-${scene.id}`}
        />
      ))}
    </Navigation>
  )
}

export default SceneNavigation
