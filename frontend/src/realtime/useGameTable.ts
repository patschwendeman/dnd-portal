import { useCallback, useEffect, useRef, useState } from 'react'

import { ConnectionStatus, createGameTableConnection, GameTableConnection } from './connection'
import { API_BASE_URL } from '../api/apiClient'
import { wsUrl } from '../api/wsUrl'
import { GameTableState } from '../models/models'

export type GameTableScreen = 'admin' | 'wall' | 'ground' | 'player'

export interface GameTable {
  // null until the first snapshot of the server arrived
  state: GameTableState | null
  // false once the connection broke or could not be established; the first attempt counts as connected, so the Admin
  // does not show the hint on every load
  connected: boolean
  reconnectNow: () => void
}

export const useGameTable = (screen: GameTableScreen): GameTable => {
  const [state, setState] = useState<GameTableState | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const connection = useRef<GameTableConnection | null>(null)

  useEffect(() => {
    const url = `${wsUrl(API_BASE_URL, window.location)}?screen=${screen}`
    const current = createGameTableConnection({ url, onState: setState, onStatus: setStatus })
    connection.current = current
    return () => {
      current.close()
      connection.current = null
    }
  }, [screen])

  const reconnectNow = useCallback(() => {
    connection.current?.reconnectNow()
  }, [])

  return { state, connected: status !== 'closed', reconnectNow }
}
