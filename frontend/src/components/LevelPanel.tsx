import { ReactElement } from 'react'
import styled from 'styled-components'

import PanelButton from './PanelButton'
import { textStyle } from '../style/tokens'
import { steppedLevel } from '../utils/player'

const NO_LEVEL = '–'

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${(props) => props.theme.space[3]};
`

const Level = styled.span`
  ${textStyle('xl')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
`

const Buttons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.space[1]};
`

// The sign stands in for an icon
const StepButton = styled(PanelButton)`
  font-family: inherit;
  ${textStyle('lg')}
  font-weight: ${(props) => props.theme.fontWeight.semibold};

  &:disabled {
    color: ${(props) => props.theme.colors.text.muted};
    cursor: default;
  }
`

interface LevelPanelProps {
  // Level of all players of the active adventure; null without an adventure
  level: number | null
  onChange: (level: number) => void
}

// Content of the dashboard panel "Level": the level shown changes only with the push of the
// server that follows the write
function LevelPanel({ level, onChange }: LevelPanelProps): ReactElement {
  const lower = level === null ? null : steppedLevel(level, -1)
  const higher = level === null ? null : steppedLevel(level, 1)

  return (
    <Row>
      <Level data-test-id="level-value">{level ?? NO_LEVEL}</Level>
      <Buttons>
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
      </Buttons>
    </Row>
  )
}

export default LevelPanel
