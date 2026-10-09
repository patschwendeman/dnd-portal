import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { TextButton } from './TextButton'
import { textStyle } from '../style/tokens'

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[2]} ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.error};
  color: ${(props) => props.theme.colors.onError};
`

const Message = styled.span`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

interface ErrorBarProps {
  message: string
  onRetry: () => void
}

const ErrorBar: FunctionComponent<ErrorBarProps> = ({ message, onRetry }): ReactElement => (
  <Bar role='alert'>
    <Message>{message}</Message>
    <TextButton $variant='default' onClick={onRetry}>Erneut versuchen</TextButton>
  </Bar>
)

export { ErrorBar }
