import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
    port: 8000
  },
  build: {
    outDir: '../dist'
  }
})