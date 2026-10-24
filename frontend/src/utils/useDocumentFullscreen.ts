import { useCallback, useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void): (() => void) => {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

const isFullscreen = (): boolean => document.fullscreenElement !== null

// Full screen of the own window (Admin); the state follows fullscreenchange, so leaving with
// Escape or by the browser is shown as well
export default function useDocumentFullscreen(): { isFullscreen: boolean, toggle: () => void } {
  const active = useSyncExternalStore(subscribe, isFullscreen)
  const toggle = useCallback(() => {
    const change = isFullscreen()
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    change.catch((err) => console.error('Error switching full screen:', err))
  }, [])
  return { isFullscreen: active, toggle }
}
