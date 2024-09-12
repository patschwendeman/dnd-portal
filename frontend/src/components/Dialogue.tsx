import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { SceneDetail } from '../models/models'

interface LayoutContainerProps {
  $isVisible: boolean;
}

interface DialogueProps {
  isVisible: boolean;
  sceneOption: SceneDetail | undefined;
  handleDialogueOption: (option: boolean) => void;
}

const LayoutContainer = styled.div<LayoutContainerProps>`
  display: ${props => (props.$isVisible ? 'flex' : 'none')}; // Display setzen basierend auf $isVisible
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.932);
  z-index: 99999;
`

const DialogueContainer = styled.div`
  width: 600px;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
`

const ButtonContainer = styled.div`
  width: 70%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const ConfirmButton = styled.button`
  width: 200px;
  height: 50px;
  background-color: white;
`

const DeclineButton = styled.button`
  width: 200px;
  height: 50px;
  background-color: white;
`

const DialogueImage = styled.img`
    width: 100%;
    height: 100%;
`

const Dialogue: FunctionComponent<DialogueProps> = ({ isVisible, sceneOption, handleDialogueOption}): ReactElement => (
    <LayoutContainer $isVisible={isVisible}>
    <DialogueContainer>
          <DialogueImage src={sceneOption?.battlemaps?.source} alt="" ></DialogueImage>
        <p>{sceneOption?.name}</p>
        <ButtonContainer>
            <ConfirmButton data-test-id='confirm-button' onClick={() => handleDialogueOption(true)}>Confirm</ConfirmButton>
            <DeclineButton data-test-id='declane-button' onClick={() => handleDialogueOption(false)}>Decline</DeclineButton>
        </ButtonContainer>
    </DialogueContainer>
  </LayoutContainer>
)

export { Dialogue }
