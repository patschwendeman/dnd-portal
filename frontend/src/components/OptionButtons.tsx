import { ReactElement } from 'react'
import styled from 'styled-components'

import { TextButton } from './TextButton'

// Wraps in the narrow panel (two columns of the dashboard), so no button is cut off
const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.space[1]};
`

const OptionButton = styled(TextButton)`
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

// Toggle buttons of a dashboard panel, one of them pressed: the value comes from the server, so
// the highlighted option changes only with the push that follows the write. A click on the
// pressed option does nothing.
function OptionButtons<T extends string>({
  options, value, testIdPrefix, onChange,
}: OptionButtonsProps<T>): ReactElement {
  return (
    <Options>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <OptionButton
            key={option.value}
            type="button"
            // Inactive in the panel area `background` instead of `secondary`
            $variant={isActive ? 'active' : 'cancel'}
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
