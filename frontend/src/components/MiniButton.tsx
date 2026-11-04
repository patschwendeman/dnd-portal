import { ReactElement } from 'react'
import { ReactSVG } from 'react-svg'
import styled from 'styled-components'

// Small icon buttons beside each row of the panel "Kampf": move (two stacked) and remove
const MINI_BUTTON_SIZE = '24px'
const MOVE_BUTTON_HEIGHT = '18px'
const MINI_ICON_SIZE = '16px'

const Button = styled.button<{ $isStacked: boolean }>`
  display: grid;
  place-items: center;
  width: ${MINI_BUTTON_SIZE};
  height: ${(props) => (props.$isStacked ? MOVE_BUTTON_HEIGHT : MINI_BUTTON_SIZE)};
  padding: 0;
  background-color: transparent;
  color: ${(props) => props.theme.colors.text.muted};
  border: none;
  border-radius: ${(props) => props.theme.radius.md};
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.text.color};
  }

  &:disabled {
    opacity: .25;
    cursor: default;
  }

  &:focus-visible {
    outline: ${(props) => props.theme.borderWidth.thick} solid
      ${(props) => props.theme.colors.primary};
  }

  svg {
    display: block;
    width: ${MINI_ICON_SIZE};
    height: ${MINI_ICON_SIZE};
  }
`

interface MiniButtonProps {
  icon: string
  // Accessible name and tooltip
  name: string
  onClick: () => void
  disabled?: boolean
  // One of the two move buttons above each other
  isStacked?: boolean
  testId?: string
}

function MiniButton({
  icon, name, onClick, disabled = false, isStacked = false, testId = undefined,
}: MiniButtonProps): ReactElement {
  return (
    <Button
      type="button"
      title={name}
      aria-label={name}
      disabled={disabled}
      data-test-id={testId}
      $isStacked={isStacked}
      onClick={onClick}
    >
      <ReactSVG src={icon} />
    </Button>
  )
}

export default MiniButton
