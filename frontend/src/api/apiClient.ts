import axios from 'axios'

export const apiClient = axios.create({
  // Set at build time (Vite inlines it); without it the API is expected on the same machine.
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/',
  timeout: 5000,
})
