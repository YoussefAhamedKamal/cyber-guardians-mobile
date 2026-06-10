import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  base: '/cyber-guardians-mobile/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: { port: 3000 },
  build: {
    chunkSizeWarningLimit: 200,
    rolldownOptions: {
      output: {
        codeSplitting: true,
      }
    }
  }
})