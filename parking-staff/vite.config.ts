import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Local (proxied via FE): /parkingstaff/
// Standalone Vercel deploy (pm-system-*.vercel.app root): /
const base = process.env.VERCEL ? '/' : '/parkingstaff/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    basicSsl()
  ],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:53569',
        changeOrigin: true,
      }
    }
  }
})
