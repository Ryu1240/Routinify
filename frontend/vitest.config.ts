import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    reporters: ['verbose', 'junit'],
    outputFile: 'test-results.xml'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}) 