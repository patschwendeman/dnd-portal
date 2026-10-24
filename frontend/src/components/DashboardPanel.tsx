import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'

import Label from './Label'

const Panel = styled.section<{ $columns: number, $rows: number }>`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  grid-column: span ${(props) => props.$columns};
  grid-row: span ${(props) => props.$rows};
  min-width: 0;
  min-height: 0;
  padding: ${(props) => props.theme.space[5]};
  background-color: ${(props) => props.theme.colors.secondary};
  border-radius: ${(props) => props.theme.radius.lg};
`

// The panel has a fixed height (rows of the dashboard); content that does not fit scrolls here
const Content = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`

interface DashboardPanelProps {
  label: string
  // Size in columns and rows of the dashboard grid
  columns: number
  rows: number
  testId: string
  children: ReactNode
}

function DashboardPanel({
  label, columns, rows, testId, children,
}: DashboardPanelProps): ReactElement {
  return (
    <Panel $columns={columns} $rows={rows} aria-label={label} data-test-id={testId}>
      <Label>{label}</Label>
      <Content>{children}</Content>
    </Panel>
  )
}

export default DashboardPanel
