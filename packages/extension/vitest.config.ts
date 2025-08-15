import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks',
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
  },
})
