import { reconnectDelay } from './backoff'
import { browserTimers, createHeartbeatWatchdog, HEARTBEAT_TIMEOUT_MS, Timers } from './heartbeat'
import { ClientMessage, parseServerMessage, ServerMessage } from './messages'
import { browserVisibility, VisibilitySource } from './visibility'
import { GameTableState } from '../models/models'

// connecting: first attempt still running; open: connected; closed: broken or not reachable, a reconnect is planned
export type ConnectionStatus = 'connecting' | 'open' | 'closed'

// The part of the browser WebSocket used here, so tests can pass a fake
export interface SocketLike {
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: (() => void) | null
  send: (data: string) => void
  close: () => void
}

export type OtherServerMessage = Exclude<ServerMessage, { type: 'state' } | { type: 'ping' }>

export interface GameTableConnectionOptions {
  url: string
  onState: (state: GameTableState) => void
  onMessage?: (message: OtherServerMessage) => void
  onStatus: (status: ConnectionStatus) => void
  createSocket?: (url: string) => SocketLike
  timers?: Timers
  heartbeatTimeoutMs?: number
  visibility?: VisibilitySource
}

export interface GameTableConnection {
  // Connects at once (e.g. "Erneut versuchen"), drops a running attempt or a planned reconnect
  reconnectNow: () => void
  // Sends only over an open connection; otherwise the message is dropped (false)
  send: (message: ClientMessage) => boolean
  close: () => void
}

const browserSocket = (url: string): SocketLike => {
  const socket = new WebSocket(url)
  const like: SocketLike = {
    onopen: null,
    onmessage: null,
    onclose: null,
    send: (data) => socket.send(data),
    close: () => socket.close(),
  }
  socket.onopen = () => like.onopen?.()
  socket.onmessage = (event) => like.onmessage?.(event)
  socket.onclose = () => like.onclose?.()
  return like
}

// Keeps a WebSocket to the server open: reconnects with backoff after every disconnect and treats a connection without
// messages for longer than the heartbeat timeout as broken. When the page becomes visible again (e.g. an unlocked
// smartphone) without an open connection, it connects at once instead of waiting for the heartbeat or the backoff.
export const createGameTableConnection = ({
  url,
  onState,
  onMessage,
  onStatus,
  createSocket = browserSocket,
  timers = browserTimers,
  heartbeatTimeoutMs = HEARTBEAT_TIMEOUT_MS,
  visibility = browserVisibility,
}: GameTableConnectionOptions): GameTableConnection => {
  let socket: SocketLike | null = null
  let open = false
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedForGood = false

  const watchdog = createHeartbeatWatchdog(() => handleDisconnect(), heartbeatTimeoutMs, timers)

  // Handlers are removed first, so a late event of an old socket cannot touch the current state
  const dropSocket = () => {
    watchdog.stop()
    open = false
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
      open = true
      onStatus('open')
      watchdog.reset()
    }
    current.onmessage = (event) => {
      watchdog.reset()
      const message = parseServerMessage(event.data)
      if (message === null || message.type === 'ping') {
        return
      }
      if (message.type === 'state') {
        onState(message.payload)
      } else {
        onMessage?.(message)
      }
    }
    current.onclose = handleDisconnect
  }

  const reconnectNow = () => {
    if (closedForGood) {
      return
    }
    cancelReconnect()
    dropSocket()
    connect()
  }

  onStatus('connecting')
  connect()

  const unsubscribeVisibility = visibility.subscribe(() => {
    if (visibility.isVisible() && !open) {
      reconnectNow()
    }
  })

  return {
    reconnectNow,
    send: (message) => {
      if (!open || socket === null) {
        return false
      }
      socket.send(JSON.stringify(message))
      return true
    },
    close: () => {
      closedForGood = true
      unsubscribeVisibility()
      cancelReconnect()
      dropSocket()
    },
  }
}
