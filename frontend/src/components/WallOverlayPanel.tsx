import { ReactElement } from 'react'
import styled from 'styled-components'

import { TextButton } from './TextButton'
import { WallOverlay } from '../models/models'

const OPTIONS: readonly { value: WallOverlay, label: string }[] = [
  { value: 'world', label: 'Weltkarte' },
  { value: 'off', label: 'Aus' },
]

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

interface WallOverlayPanelProps {
  wallOverlay: WallOverlay
  onChange: (wallOverlay: WallOverlay) => void
}

// Content of the dashboard panel "Wall-Overlay": the highlighted option changes only with the push
// of the server that follows the write
function WallOverlayPanel({ wallOverlay, onChange }: WallOverlayPanelProps): ReactElement {
  return (
    <Options>
      {OPTIONS.map((option) => {
        const isActive = option.value === wallOverlay
        return (
          <OptionButton
            key={option.value}
            type="button"
            // Inactive in the panel area `background` instead of `secondary`
            $variant={isActive ? 'active' : 'cancel'}
            aria-pressed={isActive}
            data-test-id={`wall-overlay-${option.value}`}
            onClick={() => !isActive && onChange(option.value)}
          >
            {option.label}
          </OptionButton>
        )
      })}
    </Options>
  )
}

export default WallOverlayPanel
