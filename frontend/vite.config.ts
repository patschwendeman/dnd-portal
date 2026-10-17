import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The API is reached through the dev server (same origin as the frontend), so other devices in the LAN only need the
// frontend address. In the dev compose stack the API runs in the service `api`.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.md'],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // /api/adventures → <target>/adventures (prefix removed, like nginx in production)
      '/api': {
        target: apiProxyTarget,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: apiProxyTarget,
        ws: true,
      },
    },
  },
})
