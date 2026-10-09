import { FunctionComponent, ReactElement } from 'react'
import styled, { useTheme } from 'styled-components'
import { ReactSVG } from 'react-svg'

import { textStyle } from '../style/tokens'

import reloadIcon from '/assets/icons/reload.svg'

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[1]} ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.error};
  color: ${(props) => props.theme.colors.onError};
`

const Message = styled.span`
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.medium};
`

const RetryButton = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  background-color: transparent;
  color: ${(props) => props.theme.colors.onError};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid ${(props) => props.theme.colors.onError};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }

  svg {
    display: block;
    width: ${(props) => props.theme.size.icon};
    height: ${(props) => props.theme.size.icon};
  }
`

interface ErrorBarProps {
  message: string
  onRetry: () => void
}

const ErrorBar: FunctionComponent<ErrorBarProps> = ({ message, onRetry }): ReactElement => {
  const theme = useTheme()

  return (
    <Bar role='alert'>
      <Message>{message}</Message>
      <RetryButton type='button' onClick={onRetry} aria-label='Erneut versuchen' title='Erneut versuchen'>
        <ReactSVG
          src={reloadIcon}
          beforeInjection={(svg) => {
            svg.setAttribute('style', `fill: ${theme.colors.onError}`)
            svg.setAttribute('aria-hidden', 'true')
          }}
        />
      </RetryButton>
    </Bar>
  )
}

export { ErrorBar }
