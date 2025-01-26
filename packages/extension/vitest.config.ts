import { defineConfig } from 'vite'

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
