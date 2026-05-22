import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, __dirname, '')
  const apiTarget =
    fileEnv.VITE_API_PROXY_TARGET?.trim() ||
    `http://localhost:${fileEnv.VITE_API_PORT?.trim() || '4000'}`

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('@tanstack')) return 'tanstack'
            if (id.includes('react-router')) return 'router'
            if (id.includes('axios')) return 'axios'
            if (id.includes('socket.io-client')) return 'socket'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 4001,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: apiTarget,
          ws: true,
        },
      },
    },
  }
})
