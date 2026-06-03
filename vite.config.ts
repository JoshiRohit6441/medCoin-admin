import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@mui/x-data-grid')) return 'mui-data-grid'
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('@mui/icons-material')) return 'mui-icons'
          if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@emotion')) {
            return 'mui-core'
          }
          if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux'
          if (id.includes('react-router') || id.includes('@remix-run/router')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4400',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4400',
        changeOrigin: true,
      },
    },
  },
})
