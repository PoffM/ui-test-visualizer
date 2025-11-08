/// <reference types="vitest" />

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'happy-dom',

    // Avoid writing files to disk during the CI tests:
    outputFile: {},
  },
})
