import { ReactElement } from 'react'
import styled from 'styled-components'

import Label from './Label'
import PanelButton from './PanelButton'
import { textStyle } from '../style/tokens'
import { steppedLevel } from '../utils/player'

const NO_LEVEL = '–'
// Room for two digits, so the buttons do not shift between level 9 and 10
const LEVEL_MIN_WIDTH = '2ch'

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.space[1]};
`

const StepperLabel = styled(Label)`
  margin-right: ${(props) => props.theme.space[2]};
`

const Level = styled.span`
  min-width: ${LEVEL_MIN_WIDTH};
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  text-align: center;
`

const StepButton = styled(PanelButton)`
  font-family: inherit;
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};

  &:disabled {
    color: ${(props) => props.theme.colors.text.muted};
    cursor: default;
  }
`

interface LevelStepperProps {
  /** Level of all players of the active adventure; null without an adventure */
  level: number | null
  onChange: (level: number) => void
}

/** The level shown changes only with the push of the server that follows the write */
function LevelStepper({ level, onChange }: LevelStepperProps): ReactElement {
  const lower = level === null ? null : steppedLevel(level, -1)
  const higher = level === null ? null : steppedLevel(level, 1)

  return (
    <Stepper>
      <StepperLabel>Level</StepperLabel>
      <StepButton
        type="button"
        title="Level verringern"
        aria-label="Level verringern"
        data-test-id="level-decrease"
        disabled={lower === null}
        onClick={() => lower !== null && onChange(lower)}
      >
        −
      </StepButton>
      <Level data-test-id="level-value">{level ?? NO_LEVEL}</Level>
      <StepButton
        type="button"
        title="Level erhöhen"
        aria-label="Level erhöhen"
        data-test-id="level-increase"
        disabled={higher === null}
        onClick={() => higher !== null && onChange(higher)}
      >
        +
      </StepButton>
    </Stepper>
  )
}

export default LevelStepper
