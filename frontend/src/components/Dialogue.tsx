import { FunctionComponent, ReactElement, useContext } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { TextButton } from './TextButton'
import { ActiveSceneContext } from '../context/context'
import { SceneDetail } from '../models/models'
import { textStyle } from '../style/tokens'


interface DialogueProps {
  isVisible: boolean;
  sceneOption: SceneDetail | undefined;
  handleDialogueOption: (option: boolean, sceneOption: SceneDetail | undefined, setActiveSceneId: React.Dispatch<React.SetStateAction<number>>, setDialogueVisibility: React.Dispatch<React.SetStateAction<boolean>>) => void;
  setDialogueVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}

const DIALOG_WIDTH = '600px'

const LayoutContainer = styled.div<{$isVisible: boolean}>`
  display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.colors.overlay};
  z-index: ${(props) => props.theme.layer.dialog};
`

const DialogueContainer = styled.div`
  width: ${DIALOG_WIDTH};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => props.theme.space[4]};
  padding-bottom: ${(props) => props.theme.space[5]};
  border-radius: ${(props) => props.theme.radius.lg};
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.text.color};
`

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[1]};
  padding: 0 ${(props) => props.theme.space[5]};
`

const SceneName = styled.p`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  margin: 0;
`

const SceneDescription = styled.p`
  ${textStyle('sm')}
  margin: 0;
`

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: ${(props) => props.theme.space[3]};
  padding: 0 ${(props) => props.theme.space[5]};
  cursor: pointer;
`

const DialogueImage = styled.img`
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
`

const Dialogue: FunctionComponent<DialogueProps> = ({ sceneOption, handleDialogueOption, isVisible, setDialogueVisibility }): ReactElement => {
  const { setActiveSceneId } = useContext(ActiveSceneContext)

  const handleConfirm = () => {
    if (!sceneOption) {
      
      throw new Error('Scene option is undefined')
    }
    handleDialogueOption(true, sceneOption, setActiveSceneId, setDialogueVisibility)
  }

  const handleDecline = () => {
    handleDialogueOption(false, sceneOption, setActiveSceneId, setDialogueVisibility)
  }

  return (
    <LayoutContainer $isVisible={isVisible}>
      <DialogueContainer>
        <DialogueImage src={sceneOption?.graphics_wall?.source} alt={sceneOption?.name || 'Scene Image'} />
        <TextBlock>
          <Label>Szene wechseln</Label>
          <SceneName>{sceneOption?.name}</SceneName>
          <SceneDescription>{sceneOption?.description}</SceneDescription>
        </TextBlock>
        <ButtonContainer>
          <TextButton $variant='cancel' data-test-id='decline-button' onClick={handleDecline}>Decline</TextButton>
          <TextButton $variant='active' data-test-id='confirm-button' onClick={handleConfirm}>Confirm</TextButton>
        </ButtonContainer>
      </DialogueContainer>
    </LayoutContainer>
  )
}

export { Dialogue }
