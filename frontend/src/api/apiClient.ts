import axios from 'axios'

// VITE_API_URL is inlined by Vite at build time; the fallback is the backend on the machine running the browser.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
})
