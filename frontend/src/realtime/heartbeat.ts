// The server pings every 15 s; without any message for this long the connection counts as broken
export const HEARTBEAT_TIMEOUT_MS = 35000

export interface Timers {
  setTimeout: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>
  clearTimeout: (id: ReturnType<typeof setTimeout>) => void
}

export const browserTimers: Timers = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (id) => clearTimeout(id),
}

export interface HeartbeatWatchdog {
  // Called for every received message (and when the connection opens)
  reset: () => void
  stop: () => void
}

// Calls onTimeout once if reset() is not called within timeoutMs. A silently broken connection
// (e.g. WLAN of another device gone) is otherwise noticed by the browser only much later.
export const createHeartbeatWatchdog = (
  onTimeout: () => void,
  timeoutMs: number = HEARTBEAT_TIMEOUT_MS,
  timers: Timers = browserTimers,
): HeartbeatWatchdog => {
  let timer: ReturnType<typeof setTimeout> | null = null

  const stop = () => {
    if (timer !== null) {
      timers.clearTimeout(timer)
      timer = null
    }
  }

  return {
    reset: () => {
      stop()
      timer = timers.setTimeout(() => {
        timer = null
        onTimeout()
      }, timeoutMs)
    },
    stop,
  }
}
