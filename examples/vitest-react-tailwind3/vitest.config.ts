/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',

    // Avoid writing files to disk during the CI tests:
    outputFile: {},
  },
})
