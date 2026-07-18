import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000, 
    open: true,
    strictPort: true
  },


  resolve: {
    alias: {
      // Позволяет писать import Button from '@/components/Button'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    chunks: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
      }
    }
  }
})
