import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mirror Vercel's experimental-services routing in local dev:
      // /_/backend/* → FastAPI backend at localhost:8000 (strips the prefix)
      '/_/backend': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/_\/backend/, ''),
      },
    },
  },
})
