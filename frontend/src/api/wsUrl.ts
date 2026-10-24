// The WebSocket /ws lives next to the API. Behind the proxy (API base path ending in /api/) it is
// /ws on the same host; for a direct API URL (e.g. http://localhost:8000/) it is <base>ws.
const wsUrl = (apiBaseUrl: string, location: Pick<Location, 'href'>): string => {
  const base = new URL(apiBaseUrl, location.href)
  const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  if (base.pathname.endsWith('/api/')) {
    return `${protocol}//${base.host}/ws`
  }
  const path = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`
  return `${protocol}//${base.host}${path}ws`
}

export default wsUrl
