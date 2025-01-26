import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      './test/happy-dom-tests/unused-happy-dom-tests',
    ],
    globals: true,
  },
})
