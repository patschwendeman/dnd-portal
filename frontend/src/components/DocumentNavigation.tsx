import { ReactElement } from 'react'
import styled from 'styled-components'

import Label from './Label'
import SideBarLeftElement from './SideBarLeftElement'
import { NOTE_FOLDERS, NoteFolderId } from '../notes/noteFolders'

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
  selectedFolderId: NoteFolderId
  onSelectFolder: (folderId: NoteFolderId) => void
}

function DocumentNavigation({
  selectedFolderId,
  onSelectFolder,
}: DocumentNavigationProps): ReactElement {
  return (
    <Navigation>
      <NotesLabel>Notizen</NotesLabel>
      {NOTE_FOLDERS.map(({ id, label }) => (
        <SideBarLeftElement
          key={id}
          name={label}
          isActive={id === selectedFolderId}
          onSelect={() => onSelectFolder(id)}
          testId={`notes-entry-${id}`}
        />
      ))}
    </Navigation>
  )
}

export default DocumentNavigation
