import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  server: {
    host: true,
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist'
  }
})