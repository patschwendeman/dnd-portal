import axios from 'axios'

export const apiClient = axios.create({
  // VITE_API_URL is inlined by Vite at build time; the fallback is the backend on the machine running the browser.
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/',
  timeout: 5000,
})
