import { reconnectDelay } from './backoff'
import { browserTimers, createHeartbeatWatchdog, HEARTBEAT_TIMEOUT_MS, Timers } from './heartbeat'
import { parseServerMessage } from './messages'
import { GameTableState } from '../models/models'

// connecting: first attempt still running; open: connected; closed: broken or not reachable, a reconnect is planned
export type ConnectionStatus = 'connecting' | 'open' | 'closed'

// The part of the browser WebSocket used here, so tests can pass a fake
export interface SocketLike {
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: (() => void) | null
  close: () => void
}

export interface GameTableConnectionOptions {
  url: string
  onState: (state: GameTableState) => void
  onStatus: (status: ConnectionStatus) => void
  createSocket?: (url: string) => SocketLike
  timers?: Timers
  heartbeatTimeoutMs?: number
}

export interface GameTableConnection {
  // Connects at once (e.g. "Erneut versuchen"), drops a running attempt or a planned reconnect
  reconnectNow: () => void
  close: () => void
}

const browserSocket = (url: string): SocketLike => {
  const socket = new WebSocket(url)
  const like: SocketLike = { onopen: null, onmessage: null, onclose: null, close: () => socket.close() }
  socket.onopen = () => like.onopen?.()
  socket.onmessage = (event) => like.onmessage?.(event)
  socket.onclose = () => like.onclose?.()
  return like
}

// Keeps a WebSocket to the server open: reconnects with backoff after every disconnect and treats a connection without
// messages for longer than the heartbeat timeout as broken.
export const createGameTableConnection = ({
  url,
  onState,
  onStatus,
  createSocket = browserSocket,
  timers = browserTimers,
  heartbeatTimeoutMs = HEARTBEAT_TIMEOUT_MS,
}: GameTableConnectionOptions): GameTableConnection => {
  let socket: SocketLike | null = null
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedForGood = false

  const watchdog = createHeartbeatWatchdog(() => handleDisconnect(), heartbeatTimeoutMs, timers)

  // Handlers are removed first, so a late event of an old socket cannot touch the current state
  const dropSocket = () => {
    watchdog.stop()
    if (socket !== null) {
      const old = socket
      socket = null
      old.onopen = null
      old.onmessage = null
      old.onclose = null
      old.close()
    }
  }

  const cancelReconnect = () => {
    if (reconnectTimer !== null) {
      timers.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const handleDisconnect = () => {
    dropSocket()
    if (closedForGood) {
      return
    }
    onStatus('closed')
    cancelReconnect()
    reconnectTimer = timers.setTimeout(() => {
      reconnectTimer = null
      connect()
    }, reconnectDelay(attempt))
    attempt += 1
  }

  const connect = () => {
    const current = createSocket(url)
    socket = current
    // Also limits a handshake that neither opens nor fails
    watchdog.reset()
    current.onopen = () => {
      attempt = 0
      onStatus('open')
      watchdog.reset()
    }
    current.onmessage = (event) => {
      watchdog.reset()
      const message = parseServerMessage(event.data)
      if (message?.type === 'state') {
        onState(message.payload)
      }
    }
    current.onclose = handleDisconnect
  }

  onStatus('connecting')
  connect()

  return {
    reconnectNow: () => {
      if (closedForGood) {
        return
      }
      cancelReconnect()
      dropSocket()
      connect()
    },
    close: () => {
      closedForGood = true
      cancelReconnect()
      dropSocket()
    },
  }
}
