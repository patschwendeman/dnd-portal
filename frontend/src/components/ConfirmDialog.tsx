import { ReactElement, useEffect } from 'react'
import styled from 'styled-components'

import { TextButton } from './TextButton'
import { textStyle } from '../style/tokens'

const CONFIRM_DIALOG_MAX_WIDTH = '440px'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${(props) => props.theme.layer.dialog};
  display: grid;
  place-items: center;
  padding: ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.overlay};
`

const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  max-width: ${CONFIRM_DIALOG_MAX_WIDTH};
  padding: ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.text.color};
  border: ${(props) => props.theme.borderWidth.thin} solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radius.lg};
`

const Title = styled.h2`
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
`

const Text = styled.p`
  ${textStyle('sm')}
`

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${(props) => props.theme.space[2]};
  margin-top: ${(props) => props.theme.space[2]};
`

interface ConfirmDialogProps {
  title: string
  text: string
  onDecline: () => void
  onConfirm: () => void
  testId?: string
}

// A question with Decline and Confirm like "Szene wechseln", without an image; Escape declines
function ConfirmDialog({
  title, text, onDecline, onConfirm, testId = undefined,
}: ConfirmDialogProps): ReactElement {
  useEffect(() => {
    const declineOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDecline()
      }
    }
    document.addEventListener('keydown', declineOnEscape)
    return () => document.removeEventListener('keydown', declineOnEscape)
  }, [onDecline])

  return (
    <Backdrop>
      <Box role="dialog" aria-modal="true" aria-label={title} data-test-id={testId}>
        <Title>{title}</Title>
        <Text>{text}</Text>
        <Buttons>
          <TextButton $variant="cancel" data-test-id="decline-button" onClick={onDecline}>
            Decline
          </TextButton>
          <TextButton $variant="active" data-test-id="confirm-button" onClick={onConfirm}>
            Confirm
          </TextButton>
        </Buttons>
      </Box>
    </Backdrop>
  )
}

export default ConfirmDialog
