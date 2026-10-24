import { ReactElement } from 'react'
import styled from 'styled-components'

import DashboardPanel from './DashboardPanel'

const DASHBOARD_COLUMNS = 4
// Two rows fit the previews, name and description of the active scene at common widths. Only the
// lowest height: a row grows when the content of a panel needs more (narrow window), so the panels
// never scroll or cut off their content
const DASHBOARD_ROW_HEIGHT = '144px'

const Grid = styled.aside`
  display: grid;
  grid-template-columns: repeat(${DASHBOARD_COLUMNS}, minmax(0, 1fr));
  grid-auto-rows: minmax(${DASHBOARD_ROW_HEIGHT}, auto);
  align-content: start;
  gap: ${(props) => props.theme.space[4]};
  min-width: 0;
  min-height: 0;
  /* Scrolls on its own when the grid is higher than the main area; the notes stay where they are */
  overflow-y: auto;
`

interface DashboardItem {
  id: string
  label: string
  // Fixed size in columns (of DASHBOARD_COLUMNS) and rows
  columns: number
  rows: number
  content: ReactElement
}

interface DashboardProps {
  id: string
  // In the order of the grid: left to right, top to bottom
  panels: DashboardItem[]
}

function Dashboard({ id, panels }: DashboardProps): ReactElement {
  return (
    <Grid id={id} aria-label="Dashboard" data-test-id="dashboard">
      {panels.map((panel) => (
        <DashboardPanel
          key={panel.id}
          label={panel.label}
          columns={panel.columns}
          rows={panel.rows}
          testId={`dashboard-panel-${panel.id}`}
        >
          {panel.content}
        </DashboardPanel>
      ))}
    </Grid>
  )
}

export type { DashboardItem }
export { Dashboard }
