// Hostnames under which the Admin runs on the computer itself: its origin is not reachable from a
// smartphone
const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']

// URL of the Player Screen for the QR code: the one from the API (set by the start script),
// otherwise the origin of the Admin, unless it was opened locally. null = unknown.
const selectPlayerUrl = (
  apiPlayerUrl: string | null,
  location: Pick<Location, 'origin' | 'hostname'>,
): string | null => {
  if (apiPlayerUrl !== null) {
    return apiPlayerUrl
  }
  if (LOCAL_HOSTNAMES.includes(location.hostname)) {
    return null
  }
  return `${location.origin}/`
}

export default selectPlayerUrl
