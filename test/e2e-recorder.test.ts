import fs from 'node:fs/promises'
import type { Browser } from '@playwright/test'
import { test } from '@playwright/test'
import path from 'pathe'
import { DebuggerHelper } from './debugger-helper'

// Undo changes made to the e2e test file that gets edited
for (const exampleFolder of ['vitest-react-tailwind4', 'jest-react']) {
  const e2eTestTestPath = path.join(__dirname, `../examples/${exampleFolder}/test/form-test-for-e2e.test.tsx`)
  let e2eTestTestOriginalContent: string
  test.beforeEach(async () => {
    e2eTestTestOriginalContent = await fs.readFile(e2eTestTestPath, 'utf8')
  })
  test.afterEach(async () => {
    // Undo changes made to the e2e test file
    await fs.writeFile(e2eTestTestPath, e2eTestTestOriginalContent, 'utf8')
  })
}

test.afterEach(async () => {
  // Delete the generated test file
  const generatedFilePath = path.join(__dirname, '../examples/vitest-react-tailwind4/components/FormExample.test.tsx')
  try {
    await fs.access(generatedFilePath)
    await fs.unlink(generatedFilePath)
  }
  catch {
    // ignore
  }
})

test('Create a UI test file', async ({ browser }) => {
  const page = await browser.newPage()

  await page.goto('http://localhost:8080/?folder=/source/examples/vitest-react-tailwind4')

  // Open FormExample.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('FormExample.tsx')
  await page.locator('.highlight').first().click()

  // Create the test file
  await page.getByText('FormExample', { exact: true }).click({
    button: 'right',
  })
  await page.getByRole('menuitem', { name: 'Create UI test (UI Test' }).click()

  // FormExample.test.tsx should open on its own here

  // Hide the bottom panel to get more space
  const hideButton = page.getByRole('button', { name: 'Hide Panel' })
  if (await hideButton.isVisible()) {
    await hideButton.click()
  }

  // Wait for the text "render(<FormExample />)" to appear anywhere on the page
  await page.getByText('render(<FormExample />)').waitFor()
})

test('Record a UI test, Vitest + React + Tailwind4', async ({ browser }) => {
  await runRecorderTest(browser, 'vitest-react-tailwind4', true)
})

test('Record a UI test, Jest + React', async ({ browser }) => {
  await runRecorderTest(browser, 'jest-react')
})

test('Record a UI test, Bun + Solid', async ({ browser }) => {
  await runRecorderTest(browser, 'bun-solid', true)
})

async function runRecorderTest(browser: Browser, exampleFolder: string, dismissStylePrompt = false) {
  const page = await browser.newPage()

  await page.goto(`http://localhost:8080/?folder=/source/examples/${exampleFolder}`)

  // Open form-test-for-e2e.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type('form-test-for-e2e.test.tsx')
  await page.locator('.highlight').first().click()

  // Hide the bottom panel to get more space
  const hideButton = page.getByRole('button', { name: 'Hide Panel' })
  if (await hideButton.isVisible()) {
    await hideButton.click()
  }

  // Start the visual debug
  await page.getByRole('button', { name: 'Visually Debug UI' }).click()
  await page.getByText('Tested UI').waitFor()

  const replicaPanel = page
    .frameLocator('iframe.webview.ready')
    .frameLocator('iframe[title="Tested UI"]')

  if (dismissStylePrompt) {
    // Click the OK button on the initial style prompt
    await replicaPanel.locator('ui-test-visualizer-button[title="Dismiss style prompt"]').click()
  }

  // Wait until the debugger is paused on breakpoint
  await page.getByText('Paused on breakpoint').waitFor()

  const debugHelper = new DebuggerHelper(page)
  await debugHelper.debugStep()

  // Start recording
  await replicaPanel.getByRole('button', { name: 'Record input as code' }).first().click()

  // Check that the submission count starts at 0
  await replicaPanel.getByText(`Submit Count: 0`).waitFor()

  // Fill in the first input
  await replicaPanel.getByRole('textbox', { name: 'First input' }).click()
  await replicaPanel.getByRole('textbox', { name: 'First input' }).fill('test input 1')

  // Fill in the second input
  await replicaPanel.getByRole('textbox', { name: 'Second input' }).click()
  await replicaPanel.getByRole('textbox', { name: 'Second input' }).fill('test input 2')

  // Select an option from the select menu
  await replicaPanel.getByRole('combobox', { name: 'Select menu' }).click()
  await replicaPanel.getByRole('combobox', { name: 'Select menu' }).selectOption('option2')

  // Check the code is generated for the userEvent calls
  await replicaPanel.getByText(`await userEvent.type(screen.getByRole('textbox', { name: /^first input$/i }), 'test input 1')`).waitFor()
  await replicaPanel.getByText(`await userEvent.type(screen.getByRole('textbox', { name: /^second input$/i }), 'test input 2')`).waitFor()
  await replicaPanel.getByText(`await userEvent.selectOptions(screen.getByRole('combobox', { name: /^select menu$/i }), ['option2'])`).waitFor()

  // Submit the form
  await replicaPanel.getByRole('button', { name: 'Submit' }).click()
  await replicaPanel.getByText(`await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))`).waitFor()

  // Alt-click the submit count to generate the `expect` statement
  await replicaPanel.getByText('Submit Count:').click({
    modifiers: ['Alt'],
  })
  // Check that the submission count increased due to the click, which causes the userEvent code to run in the debugger
  await replicaPanel.getByText(`Submit Count: 1`).waitFor()
  await replicaPanel.getByText(`expect(screen.getByText(/^submit count: 1$/i))`).waitFor()

  // Finish the test
  await page.getByRole('button', { name: 'Continue (F5)' }).click()

  // Wait for replica panel to be closed
  await page.frameLocator('iframe.webview.ready').locator('iframe[title="Tested UI"]').waitFor({ state: 'detached' })

  // Check for the generated code in the editor
  await page.getByText(`await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))`).waitFor()
  await page.getByText(`expect(screen.getByText(/^submit count: 1$/i))`).waitFor()
}
