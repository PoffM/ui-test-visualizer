// import { exec } from 'node:child_process'
import { chromium, test } from '@playwright/test'
import { DebuggerHelper } from './debugger-helper'

test('Steps through the Vitest+React Counter example', async () => {
  const chrome = await chromium.launch()
  const page = await chrome.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/vitest-react')

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
  await replicaPanel.locator('vscode-button[title="Dismiss style prompt"]').click()

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()

  // Refresh button should be visible
  await replicaPanel.locator('vscode-button[title="Refresh Html"]').waitFor()

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

test('Steps through the Jest+React Counter example', async () => {
  const chrome = await chromium.launch()
  const page = await chrome.newPage()

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

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()
  await debugHelper.debugStep()

  // Refresh button should be visible
  await replicaPanel.locator('vscode-button[title="Refresh Html"]').waitFor()

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
