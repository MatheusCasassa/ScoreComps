import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: '/' funciona em domínio próprio / Netlify / Vercel.
// Para GitHub Pages em https://<user>.github.io/<repo>/, defina
// a env VITE_BASE="/<repo>/" no build (ver README).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
