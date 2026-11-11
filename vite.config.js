import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import apiDevPlugin from './vite-plugin-api.js'

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          player: ['howler'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})