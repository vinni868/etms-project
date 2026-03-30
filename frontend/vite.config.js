import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your repository name
export default defineConfig({
  plugins: [react()],
  base: '/Etms-frontend/'
})