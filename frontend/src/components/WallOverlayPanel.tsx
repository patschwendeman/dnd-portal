import { ReactElement } from 'react'

import OptionButtons from './OptionButtons'
import { WallOverlay } from '../models/models'

const OPTIONS: readonly { value: WallOverlay, label: string }[] = [
  { value: 'world', label: 'Weltkarte' },
  { value: 'off', label: 'Aus' },
]

interface WallOverlayPanelProps {
  wallOverlay: WallOverlay
  onChange: (wallOverlay: WallOverlay) => void
}

function WallOverlayPanel({ wallOverlay, onChange }: WallOverlayPanelProps): ReactElement {
  return (
    <OptionButtons
      options={OPTIONS}
      value={wallOverlay}
      testIdPrefix="wall-overlay"
      onChange={onChange}
    />
  )
}

export default WallOverlayPanel
