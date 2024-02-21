import { defineConfig } from 'vite'
import type { InlineConfig as VitestInlineConfig } from 'vitest'

declare module 'vite' {
  interface UserConfig {
    test?: VitestInlineConfig
  }
}

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
