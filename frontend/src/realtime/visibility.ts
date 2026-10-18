// Visibility of the page, so tests can pass a fake (like Timers and SocketLike)
export interface VisibilitySource {
  isVisible: () => boolean
  // Calls the listener on every change of the visibility; returns the unsubscribe function
  subscribe: (listener: () => void) => () => void
}

// Without a document (vitest runs in node) the page counts as visible and never changes
export const browserVisibility: VisibilitySource = {
  isVisible: () => typeof document === 'undefined' || document.visibilityState === 'visible',
  subscribe: (listener) => {
    if (typeof document === 'undefined') {
      return () => {}
    }
    document.addEventListener('visibilitychange', listener)
    return () => document.removeEventListener('visibilitychange', listener)
  },
}
