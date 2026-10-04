import styled from 'styled-components'

import { textStyle } from '../style/tokens'

// Baustein „Label“ (DESIGN.md 1.5)
const Label = styled.span`
  ${textStyle('xs')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  letter-spacing: ${(props) => props.theme.letterSpacing.label};
  text-transform: uppercase;
`

export { Label }
