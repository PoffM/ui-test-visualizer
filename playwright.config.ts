import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './test',
  outputDir: './test/test-results',

  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
  // default 'list' when running locally
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Edge'],
    trace: 'retain-on-failure',
    headless: !!process.env.CI || !!process.env.PLAYWRIGHT_HEADLESS,
    viewport: { width: 1600, height: 800 },
  },
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
})
