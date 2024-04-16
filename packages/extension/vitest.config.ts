import { defineConfig } from 'vite'
import type { InlineConfig as VitestInlineConfig } from 'vitest'

declare module 'vite' {
  interface UserConfig {
    test?: VitestInlineConfig
  }
}

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
