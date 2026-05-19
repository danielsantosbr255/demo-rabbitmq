import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api-gateway': {
        target: process.env.GATEWAY_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gateway/, '')
      },
      '/rabbitmq-api': {
        target: process.env.RABBITMQ_API_URL || 'http://localhost:15672',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rabbitmq-api/, '/api'),
        auth: 'admin:admin'
      }
    }
  }
})
