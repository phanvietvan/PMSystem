import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/parkingstaff': {
        target: 'https://localhost:5174',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      }
    }
  }
})
