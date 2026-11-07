import { ReactElement, ReactNode } from 'react'
import styled from 'styled-components'

import Label from './Label'
import {
  ENTRANCE_CONTENT_ATTRIBUTES, tileEntranceAttributes, tileSurface, TileSurfaceProps,
} from '../style/GlobalStyle'
import { TileEntrance } from '../utils/adminEntrance'

const Panel = styled.section<TileSurfaceProps>`
  ${tileSurface}
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space[3]};
  min-width: 0;
  padding: ${(props) => props.theme.space[5]};
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${(props) => props.theme.space[3]};
`

interface DashboardPanelProps {
  /** Accessible name of the panel, also shown as its label unless `title` is given */
  label: string
  title?: string
  /** Controls at the right of the label, e.g. the level stepper of the party */
  headEnd?: ReactNode
  testId: string
  children: ReactNode
  /** While the background image of the adventure lies behind the tiles */
  isTranslucent?: boolean
  /** Place and direction in the build-up of the Admin */
  entrance?: TileEntrance
  /** The content is loaded after the panel appears, so it fades in during the build-up */
  hasLoadedContent?: boolean
}

/**
 * A tile of the dashboard with a label head; `label` is also the accessible name when a
 * different `title` is shown
 */
function DashboardPanel({
  label,
  title = undefined,
  headEnd = undefined,
  testId,
  children,
  isTranslucent = false,
  entrance = undefined,
  hasLoadedContent = false,
}: DashboardPanelProps): ReactElement {
  return (
    <Panel
      aria-label={label}
      data-test-id={testId}
      $isTranslucent={isTranslucent}
      {...(entrance && tileEntranceAttributes(entrance))}
    >
      <Head>
        <Label>{title ?? label}</Label>
        {headEnd}
      </Head>
      <div {...(hasLoadedContent && ENTRANCE_CONTENT_ATTRIBUTES)}>{children}</div>
    </Panel>
  )
}

export default DashboardPanel
