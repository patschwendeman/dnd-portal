import { API_BASE_URL } from './apiClient'

// Media paths from the backend are relative to the API (e.g. /media/images/...), not to the
// frontend.
export const buildMediaUrl = (baseUrl: string, source: string): string => (
  `${baseUrl.replace(/\/+$/, '')}/${source.replace(/^\/+/, '')}`
)

export const mediaUrl = (source: string): string => buildMediaUrl(API_BASE_URL, source)
