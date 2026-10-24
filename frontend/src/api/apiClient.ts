import axios from 'axios'

// VITE_API_URL is inlined by Vite at build time. The fallback is relative to the frontend: the Vite
// dev server and nginx proxy /api/ to the API, so every device that opens the frontend also reaches
// the API.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
})
