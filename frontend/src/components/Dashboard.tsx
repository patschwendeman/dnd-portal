import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'

import { hoverScrollbar } from '../style/GlobalStyle'

// A grid instead of a flex column: grid items never shrink below their content, so a panel that
// cuts off its overflow (the stage) keeps its height when the dashboard is higher than the main
// area
const Column = styled.aside`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: ${(props) => props.theme.space[4]};
  padding: ${(props) => props.theme.space[5]} 0;
  min-width: 0;
  min-height: 0;
  /* As high as its panels, at most the main area */
  align-self: start;
  max-height: 100%;
  /* Scrolls on its own when the panels are higher than the main area; the notes stay where they
     are */
  overflow-y: auto;
  ${hoverScrollbar}
`

interface DashboardProps {
  id: string
  children: ReactNode
}

function Dashboard({ id, children }: DashboardProps): ReactElement {
  return (
    <Column id={id} aria-label="Dashboard" data-test-id="dashboard">
      {children}
    </Column>
  )
}

export default Dashboard
