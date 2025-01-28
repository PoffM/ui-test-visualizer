/// <reference types="vitest" />

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    globals: true,
    environment: 'happy-dom',

    // Avoid writing files to disk during the CI tests:
    outputFile: {},
  },
})
