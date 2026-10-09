import styled from 'styled-components'

import { textStyle } from '../style/tokens'

type TextButtonVariant = 'default' | 'active' | 'cancel'

// No letter spacing: it is only used for labels in capitals.
const TextButton = styled.button<{ $variant: TextButtonVariant }>`
  min-width: ${(props) => props.theme.size.button.minWidth};
  height: ${(props) => props.theme.size.control.md};
  padding: 0 ${(props) => props.theme.space[4]};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  font-family: inherit;
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  cursor: pointer;
  background-color: ${(props) => {
    switch (props.$variant) {
      case 'active':
        return props.theme.colors.primary
      case 'cancel':
        return props.theme.colors.background
      default:
        return props.theme.colors.secondary
    }
  }};
  color: ${(props) => (props.$variant === 'active' ? props.theme.colors.onPrimary : props.theme.colors.text.color)};
`

export { TextButton }
export type { TextButtonVariant }
