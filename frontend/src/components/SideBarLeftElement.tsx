import { ReactElement } from 'react'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'

const LOCKED_OPACITY = 0.45

// A button, so the lists in the panel can be used with the keyboard (Tab, Enter, Space)
const NavigationElement = styled.button<{ $isElementActive: boolean }>`
  display: block;
  flex-shrink: 0;
  width: 100%;
  height: ${(props) => props.theme.size.control.md};
  /* Only the active entry has a surface, so it stands out in long lists */
  background-color: ${(props) => (
    props.$isElementActive ? props.theme.colors.primary : 'transparent'
  )};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  margin: 0;
  text-align: left;
  cursor: pointer;
  padding: 0 ${(props) => props.theme.space[3]};
  font-family: inherit;
  ${textStyle('sm')}
  /* Centers the single line vertically inside the fixed height */
  line-height: ${(props) => props.theme.size.control.md};
  font-weight: ${(props) => props.theme.fontWeight.medium};
  color: ${(props) => (
    props.$isElementActive ? props.theme.colors.onPrimary : props.theme.colors.text.color
  )};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background-color: ${(props) => (
      props.$isElementActive ? props.theme.colors.primary : props.theme.colors.background
    )};
  }

  /* Locked during a fight; the active entry stays readable */
  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: ${(props) => (props.$isElementActive ? 1 : LOCKED_OPACITY)};
  }

  &[aria-disabled="true"]:hover {
    background-color: ${(props) => (
      props.$isElementActive ? props.theme.colors.primary : 'transparent'
    )};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

interface SideBarLeftElementProps {
  name: string
  isActive: boolean
  onSelect: () => void
  // Shown, but without effect (aria-disabled keeps it focusable and its tooltip)
  isDisabled?: boolean
  testId?: string
}

function SideBarLeftElement({
  name,
  isActive,
  onSelect,
  isDisabled = false,
  testId = undefined,
}: SideBarLeftElementProps): ReactElement {
  return (
    <NavigationElement
      type="button"
      // Full name as tooltip, because a long name is cut off with an ellipsis
      title={name}
      aria-current={isActive ? 'true' : undefined}
      aria-disabled={isDisabled || undefined}
      $isElementActive={isActive}
      data-test-id={testId}
      data-active={isActive}
      onClick={isDisabled ? undefined : onSelect}
    >
      {name}
    </NavigationElement>
  )
}

export default SideBarLeftElement
