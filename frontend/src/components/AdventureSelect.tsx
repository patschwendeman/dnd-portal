import { ReactElement } from 'react'

import { SelectList } from './SelectList'
import { AdventureSummary } from '../models/models'

interface AdventureSelectProps {
  adventures: AdventureSummary[]
  activeAdventureId: number | null
  onSelectAdventure: (adventureId: number) => void
  // During a fight: the list does not open, a lock replaces the arrow
  isLocked?: boolean
  // While the error bar stands no adventure can be switched
  isDisabled?: boolean
}

function AdventureSelect({
  adventures,
  activeAdventureId,
  onSelectAdventure,
  isLocked = false,
  isDisabled = false,
}: AdventureSelectProps): ReactElement {
  return (
    <SelectList
      options={adventures.map((adventure) => ({ value: adventure.id, label: adventure.name }))}
      value={activeAdventureId}
      onChange={onSelectAdventure}
      label="Abenteuer"
      testId="adventure-select"
      optionTestIdPrefix="adventure-option"
      isLocked={isLocked}
      lockedTitle="Während des Kampfes nicht wechselbar"
      isDisabled={isDisabled}
    />
  )
}

export default AdventureSelect
