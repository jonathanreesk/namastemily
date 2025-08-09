import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  server: {
    host: true,
    port: 8000
  },
  build: {
    outDir: '../dist'
  }
})