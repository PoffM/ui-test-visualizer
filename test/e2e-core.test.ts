import { expect, test } from '@playwright/test'
import { DebuggerHelper } from './debugger-helper'

test('Steps through the Vitest+React+Tailwind@4 Counter example', async ({ browser }) => {
  const page = await browser.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/vitest-react-tailwind4')

  // Open basic.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('basic.test')
  await page.locator('.highlight').first().click()

  // Start the visual debug
  await page.getByRole('button', { name: 'Visually Debug UI' }).click()
  await page.getByText('Tested UI').waitFor()

  const replicaPanel = page
    .frameLocator('iframe.webview.ready')
    .frameLocator('iframe[title="Tested UI"]')

  // Click the OK button on the initial style prompt
  await replicaPanel.locator('ui-test-visualizer-button[title="Dismiss style prompt"]').click()

  // Wait until the debugger is paused on breakpoint
  await page.getByText('Paused on breakpoint').waitFor()

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()

  // Refresh button should be visible
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Refresh Panel HTML"]').waitFor()

  await replicaPanel.getByText('Count: 0').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  // Enable the Tailwind v4 style
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Enable your styles"]').click()
  await replicaPanel.getByText('src/style.css').click()
  await replicaPanel.locator('ui-test-visualizer-button[title="Apply styles"]').click()

  // Wait for the button to turn green because of the new styles
  await expect.poll(
    async () => await replicaPanel.getByRole('button', { name: 'Increment' })
      .evaluate(
        button => window.getComputedStyle(button).getPropertyValue('background-color'),
      ),
  ).toBe('oklch(0.448 0.119 151.328)') // green

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 2').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  await debugHelper.debugContinue()

  // Wait for the DOM replica's Webview to close
  await page.waitForFunction(
    () => !document.querySelector('Tested UI'),
  )
})

test('Steps through the Vitest+React+Tailwind@3 Counter example', async ({ browser }) => {
  const page = await browser.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/vitest-react-tailwind3')

  // Open basic.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('basic.test')
  await page.locator('.highlight').first().click()

  // Start the visual debug
  await page.getByRole('button', { name: 'Visually Debug UI' }).click()
  await page.getByText('Tested UI').waitFor()

  const replicaPanel = page
    .frameLocator('iframe.webview.ready')
    .frameLocator('iframe[title="Tested UI"]')

  // Click the OK button on the initial style prompt
  await replicaPanel.locator('ui-test-visualizer-button[title="Dismiss style prompt"]').click()

  // Wait until the debugger is paused on breakpoint
  await page.getByText('Paused on breakpoint').waitFor()

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()

  // Refresh button should be visible
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Refresh Panel HTML"]').waitFor()

  await replicaPanel.getByText('Count: 0').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  // Enable the SCSS + Tailwind v3 style
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Enable your styles"]').click()
  await replicaPanel.getByText('style.scss').click()
  await replicaPanel.locator('ui-test-visualizer-button[title="Apply styles"]').click()

  // Wait for the button to turn green because of the new styles
  await expect.poll(
    async () => await replicaPanel.getByRole('button', { name: 'Increment' })
      .evaluate(
        button => window.getComputedStyle(button).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(22, 101, 52)') // green

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 2').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  await debugHelper.debugContinue()

  // Wait for the DOM replica's Webview to close
  await page.waitForFunction(
    () => !document.querySelector('Tested UI'),
  )
})

// TODO figure out why segfaults happen when running Jest
// Seems to happen randomly, but more often on GitHub Actions
// The error is "Segmentation fault (core dumped)", and happens for me sometimes even when running the tests using the Jest VSCode extension.
;(process.env.CI ? test.skip : test)('Steps through the Jest+React Counter example', async ({ browser }) => {
  const page = await browser.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/jest-react')

  // Open basic.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('basic.test')
  await page.locator('.highlight').first().click()

  await page.getByRole('button', { name: 'Visually Debug UI' }).click()
  await page.getByText('Tested UI').waitFor()

  const replicaPanel = page
    .frameLocator('iframe.webview.ready')
    .frameLocator('iframe[title="Tested UI"]')

  // Wait until the debugger is paused on breakpoint
  await page.getByText('Paused on breakpoint').waitFor()

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()

  // Refresh button should be visible
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Refresh Panel HTML"]').waitFor()

  await replicaPanel.getByText('Count: 0').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 2').waitFor()

  await debugHelper.debugStep()
  await replicaPanel.getByText('Count: 1').waitFor()

  await debugHelper.debugContinue()

  // Wait for the DOM replica's Webview to close
  await page.waitForFunction(
    () => !document.querySelector('Tested UI'),
  )
})
