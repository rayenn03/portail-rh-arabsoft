import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'react-vendor'
            if (id.includes('react-dom'))    return 'react-vendor'
            if (id.includes('/react/'))      return 'react-vendor'
            if (id.includes('axios'))        return 'http-vendor'
            if (id.includes('recharts') || id.includes('d3-'))  return 'charts-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    warmup: {
      clientFiles: [
        './src/pages/Dashboard.jsx',
        './src/pages/Demandes.jsx',
        './src/components/Layout.jsx',
      ],
    },
  },
})
