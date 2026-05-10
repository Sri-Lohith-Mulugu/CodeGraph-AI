import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This creates a shortcut so you can import using '@/components/...'
      '@': path.resolve(__dirname, './src'),
    },
    // This tells Vite to automatically try these extensions
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  }
})