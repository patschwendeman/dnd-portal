export const RECONNECT_BASE_DELAY_MS = 1000
export const RECONNECT_MAX_DELAY_MS = 10000

// Delay before reconnect attempt number `attempt` (0 = first attempt after a disconnect): 1 s, 2 s, 4 s … at most 10 s
export const reconnectDelay = (attempt: number): number =>
  Math.min(RECONNECT_BASE_DELAY_MS * 2 ** Math.max(0, attempt), RECONNECT_MAX_DELAY_MS)
