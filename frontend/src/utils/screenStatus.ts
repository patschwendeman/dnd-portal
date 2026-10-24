import { FullscreenScreen, ScreenCounts } from '../realtime/messages'

// Texts of the dashboard panel "Screens"; null: the server has not sent the counts yet
export const NO_STATUS = '–'

export const screenStatusText = (count: number | null): string => {
  if (count === null) {
    return NO_STATUS
  }
  if (count === 0) {
    return 'nicht verbunden'
  }
  return count === 1 ? 'verbunden' : `${count} verbunden`
}

export const playerStatusText = (count: number | null): string => (
  count === null ? NO_STATUS : `${count} Spieler verbunden`
)

// Per screen whether the browser of a Wall or Ground refused the last full screen request
export type FullscreenHints = Record<FullscreenScreen, boolean>

export const NO_FULLSCREEN_HINTS: FullscreenHints = { wall: false, ground: false }

// A hint is dropped once a screen of the type is in full screen (e.g. after the click into it) or
// none is connected any more
export const updateFullscreenHints = (
  hints: FullscreenHints,
  counts: ScreenCounts,
): FullscreenHints => ({
  wall: hints.wall && counts.wall > 0 && counts.fullscreen.wall === 0,
  ground: hints.ground && counts.ground > 0 && counts.fullscreen.ground === 0,
})

export const fullscreenHintText = (name: string): string => (
  `Vollbild vom Browser abgelehnt – einmal in das ${name}-Fenster klicken`
)
