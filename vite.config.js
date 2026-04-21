import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'https://happybox.uz', changeOrigin: true },
      '/uploads': { target: 'https://happybox.uz', changeOrigin: true },
    }
  }
})
