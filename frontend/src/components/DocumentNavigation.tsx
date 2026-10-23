import { FunctionComponent, ReactElement } from 'react'
import styled from 'styled-components'

import { Label } from './Label'
import { SideBarLeftElement } from './SideBarLeftElement'

// Order matches the note folders loaded by DocumentReader (index = selectedStoryIndex)
const STORY_NAMES = ['Main', 'Fight', 'Side', 'Leveling', 'Mechaniken']

const Navigation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${(props) => props.theme.space[1]};
`

const NotesLabel = styled(Label)`
  padding: 0 ${(props) => props.theme.space[3]} ${(props) => props.theme.space[2]};
`

interface DocumentNavigationProps {
  selectedStoryIndex: number
  onSelectStory: (index: number) => void
}

const DocumentNavigation: FunctionComponent<DocumentNavigationProps> = ({
  selectedStoryIndex,
  onSelectStory,
}): ReactElement => (
  <Navigation>
    <NotesLabel>Notizen</NotesLabel>
    {STORY_NAMES.map((name, index) => (
      <SideBarLeftElement
        key={name}
        name={name}
        selectedStoryIndex={selectedStoryIndex}
        handleStorySelect={onSelectStory}
        index={index}
      />
    ))}
  </Navigation>
)

export { DocumentNavigation }
