import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // One chunk on purpose: pages are prerendered with renderToString, which
  // can't wait for React.lazy chunks. ~155 kB gzipped with every topic.
  build: { chunkSizeWarningLimit: 800 },
  test: { environment: 'node' },
} as any)
