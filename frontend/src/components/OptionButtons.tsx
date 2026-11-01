import { ReactElement } from 'react'
import styled from 'styled-components'

import { textStyle } from '../style/tokens'

// Segment control: one surface, the buttons inside have none; together as high as a control
const Options = styled.div`
  display: flex;
  gap: ${(props) => props.theme.space[1]};
  min-width: 0;
  padding: ${(props) => props.theme.space[1]};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radius.lg};
`

// Grows and shrinks with its text, so a short option ("Aus") leaves room for a long one in the
// narrow dashboard. Only the pressed option has a surface
const OptionButton = styled.button`
  flex: 1 1 auto;
  min-width: 0;
  height: calc(${(props) => props.theme.size.control.md} - 2 * ${(props) => props.theme.space[1]});
  padding: 0 ${(props) => props.theme.space[2]};
  overflow: hidden;
  background-color: transparent;
  color: ${(props) => props.theme.colors.text.color};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  font-family: inherit;
  ${textStyle('sm')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.colors.secondary};
  }

  &[aria-pressed="true"] {
    background-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.onPrimary};
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
    outline-offset: ${(props) => props.theme.borderWidth.thick};
  }
`

interface Option<T extends string> {
  value: T
  label: string
}

interface OptionButtonsProps<T extends string> {
  options: readonly Option<T>[]
  value: T
  // data-test-id of a button: `<testIdPrefix>-<value>`
  testIdPrefix: string
  onChange: (value: T) => void
}

// The highlighted option changes only with the push of the server that follows the write
function OptionButtons<T extends string>({
  options, value, testIdPrefix, onChange,
}: OptionButtonsProps<T>): ReactElement {
  return (
    <Options role="group">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <OptionButton
            key={option.value}
            type="button"
            aria-pressed={isActive}
            data-test-id={`${testIdPrefix}-${option.value}`}
            onClick={() => !isActive && onChange(option.value)}
          >
            {option.label}
          </OptionButton>
        )
      })}
    </Options>
  )
}

export default OptionButtons
