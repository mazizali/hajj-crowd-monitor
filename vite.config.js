import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // suppress 500 kB warning (recharts is large)
  },
  server: {
    proxy: {
      // In local dev, forward /api/* to the Python backend
      '/api': 'http://localhost:8000',
    },
  },
})
