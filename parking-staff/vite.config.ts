import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: '/parkingstaff/',
  plugins: [
    react(),
    tailwindcss(),
    basicSsl()
  ],
  server: {
    port: 5174,
    host: true, // Listen on all network interfaces including 192.168.16.1
    proxy: {
      '/api': {
        target: 'https://localhost:53568',
        changeOrigin: true,
        secure: false, // Bypasses self-signed SSL verification for backend connection
      }
    }
  }
})
