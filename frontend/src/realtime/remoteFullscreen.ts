// Full screen of a Wall or Ground, switched by the Admin. Browsers allow requestFullscreen only
// with a user activation in the same window. A request over the WebSocket has none, so the browser
// usually refuses it; then the screen reports the refusal and switches with the next click into it.
// A window the Admin opened itself can be switched at once: the Admin passes its own activation on
// with a window message (capability delegation, Chrome).

// Type of the window message the Admin sends to a screen window it opened
const DELEGATED_FULLSCREEN_MESSAGE = 'dnd-portal-fullscreen'

// The part of the document used here, so unit tests can pass a fake
export interface FullscreenTarget {
  isFullscreen: () => boolean
  request: () => Promise<void>
  exit: () => Promise<void>
}

export interface RemoteFullscreen {
  // Request of the Admin, over the server or delegated by the window that opened this one
  handleRequest: (active: boolean) => void
  // A click into this screen: repeats a refused request with the user activation of the click
  handleUserActivation: () => void
}

export const createRemoteFullscreen = (
  target: FullscreenTarget,
  onRejected: () => void,
): RemoteFullscreen => {
  // A refused request waits for the next click until the Admin switches full screen off
  let pending = false
  // A delegated request and the same request over the server arrive one after the other; the
  // second must not run while the first one is still open
  let requesting = false

  const enter = () => {
    if (requesting || target.isFullscreen()) {
      return
    }
    requesting = true
    target.request().then(
      () => {
        pending = false
      },
      () => {
        pending = true
        onRejected()
      },
    ).finally(() => {
      requesting = false
    })
  }

  return {
    handleRequest: (active) => {
      if (active) {
        enter()
        return
      }
      pending = false
      if (target.isFullscreen()) {
        target.exit().catch((err) => console.error('Error leaving full screen:', err))
      }
    },
    handleUserActivation: () => {
      if (pending) {
        pending = false
        enter()
      }
    },
  }
}

const documentTarget: FullscreenTarget = {
  isFullscreen: () => document.fullscreenElement !== null,
  request: () => document.documentElement.requestFullscreen(),
  exit: () => document.exitFullscreen(),
}

export const isDocumentFullscreen = (): boolean => documentTarget.isFullscreen()

interface BindRemoteFullscreenOptions {
  onRejected: () => void
  // The full screen state changed (also by Escape or the browser itself)
  onChange: (active: boolean) => void
}

interface BoundRemoteFullscreen {
  handleRequest: (active: boolean) => void
  unbind: () => void
}

// Connects the browser window of a Wall or Ground: full screen changes, clicks and requests
// delegated by the Admin window. Returns the request handler for messages of the server and the
// cleanup.
export const bindRemoteFullscreen = ({
  onRejected, onChange,
}: BindRemoteFullscreenOptions): BoundRemoteFullscreen => {
  const remote = createRemoteFullscreen(documentTarget, onRejected)
  const handleChange = () => onChange(documentTarget.isFullscreen())
  const handlePointerDown = () => remote.handleUserActivation()
  const handleWindowMessage = (event: MessageEvent) => {
    if (event.origin === window.location.origin && event.data === DELEGATED_FULLSCREEN_MESSAGE) {
      remote.handleRequest(true)
    }
  }
  document.addEventListener('fullscreenchange', handleChange)
  // Capture: also clicks on controls that stop the event count
  document.addEventListener('pointerdown', handlePointerDown, true)
  window.addEventListener('message', handleWindowMessage)
  return {
    handleRequest: remote.handleRequest,
    unbind: () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('message', handleWindowMessage)
    },
  }
}

// Admin: passes the activation of the current click on to a screen window it opened, so that window
// may switch to full screen without a click of its own. Browsers without capability delegation
// deliver the message without it; the screen then reports the refusal like for a request over the
// server.
export const delegateFullscreen = (target: Window): void => {
  // delegate is not yet part of the DOM types of TypeScript
  const options: WindowPostMessageOptions & { delegate: string } = {
    targetOrigin: window.location.origin,
    delegate: 'fullscreen',
  }
  try {
    target.postMessage(DELEGATED_FULLSCREEN_MESSAGE, options)
  } catch (err) {
    console.error('Error delegating full screen:', err)
  }
}
