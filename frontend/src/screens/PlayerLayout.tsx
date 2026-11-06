import {
  ReactElement, useContext, useEffect, useMemo, useState,
} from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'

import AdventureBackground from '../components/AdventureBackground'
import { ActiveAdventureContext, GameTableContext } from '../context/context'
import { AdventureDetail, Player, Theme } from '../models/models'
import getPlayerAdventure from '../service/playerScreen'
import { loadLatest } from '../utils/loadSafely'
import { effectiveTheme } from '../utils/playerTheme'
import { useAdventureBackground } from '../utils/useAdventureBackground'

export interface PlayerOutlet {
  // Theme chosen on this device, null = follows the game table
  themeOverride: Theme | null
  onChangeThemeOverride: (override: Theme | null) => void
  // Name and players of the active adventure; null while they load, after a failed load or
  // without an active adventure
  adventureName: string | null
  players: Player[] | null
  // Level of all players of the active adventure; null like the players
  globalLevel: number | null
  loadFailed: boolean
  retryLoad: () => void
  // Whether the background image lies behind the surfaces
  isTranslucent: boolean
  // Hint on the selection after the adventure of the chosen character was replaced
  hasAdventureNotice: boolean
  setAdventureNotice: (hasNotice: boolean) => void
}

export const usePlayerOutlet = (): PlayerOutlet => useOutletContext<PlayerOutlet>()

interface PlayerLayoutProps {
  themeOverride: Theme | null
  onChangeThemeOverride: (override: Theme | null) => void
}

// Shared by the selection and the Player Screen, so switching between them keeps the loaded
// players, the background image and the hint instead of loading them again
export function PlayerLayout({
  themeOverride, onChangeThemeOverride,
}: PlayerLayoutProps): ReactElement {
  const { activeAdventureId } = useContext(ActiveAdventureContext)
  const { theme: tableTheme } = useContext(GameTableContext)
  const [adventure, setAdventure] = useState<AdventureDetail>()
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [hasAdventureNotice, setAdventureNotice] = useState(false)

  // A failure belongs to the adventure it happened for; reset during render instead of in an
  // effect
  const [prevActiveAdventureId, setPrevActiveAdventureId] = useState(activeAdventureId)
  if (activeAdventureId !== prevActiveAdventureId) {
    setPrevActiveAdventureId(activeAdventureId)
    setLoadFailed(false)
  }

  useEffect(() => {
    let stale = false

    if (activeAdventureId === null) {
      return undefined
    }

    loadLatest(
      () => getPlayerAdventure(activeAdventureId),
      setAdventure,
      (err) => {
        console.error('Error fetching adventure:', err)
        setLoadFailed(true)
      },
      () => stale,
    )

    return () => {
      stale = true
    }
  }, [activeAdventureId, retryCount])

  // The detail of the previous adventure stays until the new one is loaded; it counts as not
  // loaded meanwhile
  const activeAdventure = activeAdventureId !== null && adventure?.id === activeAdventureId
    ? adventure
    : undefined
  const background = useAdventureBackground(
    activeAdventure,
    effectiveTheme(themeOverride, tableTheme),
  )

  const outlet = useMemo<PlayerOutlet>(() => ({
    themeOverride,
    onChangeThemeOverride,
    adventureName: activeAdventure?.name ?? null,
    players: activeAdventure?.players ?? null,
    globalLevel: activeAdventure?.global_level ?? null,
    loadFailed,
    retryLoad: () => {
      setLoadFailed(false)
      setRetryCount((count) => count + 1)
    },
    isTranslucent: background.isImageShown,
    hasAdventureNotice,
    setAdventureNotice,
  }), [
    themeOverride, onChangeThemeOverride, activeAdventure, loadFailed, background.isImageShown,
    hasAdventureNotice,
  ])

  return (
    <>
      <AdventureBackground
        layers={background.layers}
        shown={background.shown}
        onLoad={background.onLoad}
        onError={background.onError}
      />
      <Outlet context={outlet} />
    </>
  )
}
