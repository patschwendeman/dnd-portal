import { API_BASE_URL } from './apiClient'

// The backend returns media paths relative to the API (e.g. /media/images/...); the files are served by the API,
// not by the frontend, so they are resolved against the same base URL as the API requests.
export const buildMediaUrl = (baseUrl: string, source: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${source.replace(/^\/+/, '')}`

export const mediaUrl = (source: string): string => buildMediaUrl(API_BASE_URL, source)
