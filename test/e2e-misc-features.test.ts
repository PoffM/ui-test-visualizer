import type { FrameLocator, Page } from '@playwright/test'
import { chromium, expect, test } from '@playwright/test'
import { DebuggerHelper } from './debugger-helper'

let page: Page
let replicaPanel: FrameLocator

// Run the Counter example up to "Count: 1"
test.beforeAll(async () => {
  const chrome = await chromium.launch()
  page = await chrome.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/vitest-react')

  // Open basic.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('basic.test')
  await page.locator('.highlight').first().click()

  // Start the visual debug
  await page.getByRole('button', { name: 'Visually Debug UI' }).click()
  await page.getByText('Tested UI').waitFor()

  replicaPanel = page
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
})

test('Load an external css file', async () => {
  // Add the external file
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Enable your styles"]').click()
  await replicaPanel.getByRole('button', { name: 'Add external file' }).click()
  await page.getByLabel('input').clear()
  await page.getByLabel('input').fill('/test-style.css')
  await page.getByRole('button', { name: 'OK' }).click()

  await replicaPanel.locator('ui-test-visualizer-button[title="Apply styles"]').click()

  // Wait for the Decrement button to turn purple because of the new styles
  await expect.poll(
    async () => await replicaPanel.getByRole('button', { name: 'Decrement' })
      .evaluate(
        button => window.getComputedStyle(button).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(128, 0, 128)')

  // Disable the external css file
  await replicaPanel.locator('ui-test-visualizer-button[aria-label="Enable your styles"]').click()
  await replicaPanel.locator('label').filter({ hasText: '/test-style.css' }).getByLabel('Checkbox').click()
  await replicaPanel.getByRole('button', { name: 'OK' }).click()

  // Wait for the Decrement button to turn back to the original color
  await expect.poll(
    async () => await replicaPanel.getByRole('button', { name: 'Decrement' })
      .evaluate(
        button => window.getComputedStyle(button).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(239, 239, 239)')
})

test('Refresh button', async () => {
  // Modify the panel's HTML
  await replicaPanel.getByRole('heading', { name: 'Counter' }).evaluate(
    node => node.textContent = 'Counter (test text)',
  )

  // Click the refresh button
  await replicaPanel.getByRole('button', { name: 'Refresh Panel HTML' }).first().click()

  // You should see the original text
  await replicaPanel.getByRole('heading', { name: 'Counter' }).isVisible()
})

test('Dark mode toggle', async () => {
  // check for light mode background color
  await expect.poll(
    async () => await replicaPanel.locator('html').last()
      .evaluate(
        node => window.getComputedStyle(node).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(255, 255, 255)')
  await replicaPanel.getByRole('button', { name: 'Switch to dark mode' }).first().click()

  // check for dark mode background color
  await expect.poll(
    async () => await replicaPanel.locator('html').last()
      .evaluate(
        node => window.getComputedStyle(node).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(30, 30, 30)')

  await replicaPanel.getByRole('button', { name: 'Switch to light mode' }).first().click()

  // check for light mode background color
  await expect.poll(
    async () => await replicaPanel.locator('html').last()
      .evaluate(
        node => window.getComputedStyle(node).getPropertyValue('background-color'),
      ),
  ).toBe('rgb(255, 255, 255)')
})
