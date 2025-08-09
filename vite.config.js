import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  server: {
    port: 8000
  },
  build: {
    outDir: '../dist'
  }
})