import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'

import Label from './Label'

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  min-width: 0;
  padding: ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.radius.lg};
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[3]};
`

interface DashboardPanelProps {
  // Accessible name of the panel, also shown as its label unless `title` is given
  label: string
  title?: string
  // Controls at the right of the label, e.g. the level stepper of the party
  headEnd?: ReactNode
  testId: string
  children: ReactNode
}

function DashboardPanel({
  label, title = undefined, headEnd = undefined, testId, children,
}: DashboardPanelProps): ReactElement {
  return (
    <Panel aria-label={label} data-test-id={testId}>
      <Head>
        <Label>{title ?? label}</Label>
        {headEnd}
      </Head>
      <div>{children}</div>
    </Panel>
  )
}

export default DashboardPanel
