import fs from 'node:fs/promises'
import type { Browser } from '@playwright/test'
import { test } from '@playwright/test'
import path from 'pathe'
import { DebuggerHelper } from './debugger-helper'

// Undo changes made to the e2e test file that gets edited
for (const exampleFolder of ['vitest-react-tailwind4', 'jest-react', 'bun-solid']) {
  const e2eTestTestPath = path.join(__dirname, `../examples/${exampleFolder}/test/form-test-for-e2e.test.tsx`)
  let e2eTestTestOriginalContent: string
  test.beforeAll(async () => {
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
  await recordFormTest(browser, 'vitest-react-tailwind4', 'form-test-for-e2e.test.tsx', true)
})

test('Record a UI test, Jest + React', async ({ browser }) => {
  test.skip(!!process.env.CI, 'Rely on the other Jest + React recorder test to save time in CI')
  await recordFormTest(browser, 'jest-react', 'form-test-for-e2e.test.tsx')
})

test('Record a UI test, Bun + Solid', async ({ browser }) => {
  await recordFormTest(browser, 'bun-solid', 'form-test-for-e2e.test.tsx', true)
})

test.describe('Record TodoList test, Jest + React', () => {
  // Undo changes made to the TodoList.test.tsx file that gets edited
  {
    const todoListTestPath = path.join(__dirname, '../examples/jest-nextjs-minimal/components/TodoList.test.tsx')
    let todoListTestOriginalContent: string = ''
    test.beforeAll(async () => {
      todoListTestOriginalContent = await fs.readFile(todoListTestPath, 'utf8')
    })
    test.afterEach(async () => {
      // Undo changes made to the TodoList.test.tsx file
      await fs.writeFile(todoListTestPath, todoListTestOriginalContent, 'utf8')
    })
  }

  test('Record TodoList test, Jest + React', async ({ browser }) => {
    const { page, replicaPanel } = await startRecorderTest(browser, 'jest-nextjs-minimal', 'TodoList.test.tsx', true)

    // Add todos
    await replicaPanel.getByRole('textbox', { name: 'Add a new todo' }).click()
    await replicaPanel.getByRole('textbox', { name: 'Add a new todo' }).fill('todo 1')
    await page.keyboard.press('Enter')
    await replicaPanel.getByRole('textbox', { name: 'Add a new todo' }).fill('todo 2')
    await page.keyboard.press('Enter')
    await replicaPanel.getByRole('textbox', { name: 'Add a new todo' }).fill('todo 3')
    await page.keyboard.press('Enter')

    // Initial text
    await replicaPanel.getByText('0 done').waitFor()
    await replicaPanel.getByText('3 in progress').waitFor()

    // Toggle todos
    await replicaPanel.getByRole('checkbox', { name: 'Toggle done' }).nth(1).check()
    await replicaPanel.getByRole('checkbox', { name: 'Toggle done' }).nth(2).check()
    await replicaPanel.getByText('2 done').waitFor()
    await replicaPanel.getByText('1 in progress').waitFor()

    // Delete todos
    await replicaPanel.getByRole('button', { name: 'Delete' }).first().click()
    await replicaPanel.getByRole('button', { name: 'Delete' }).nth(1).click()
    await replicaPanel.getByText('1 done').waitFor()
    await replicaPanel.getByText('0 in progress').waitFor()

    // Generate 'expect' statements
    await replicaPanel.getByText(/^1 done$/).first().click({
      modifiers: ['Alt'],
    })
    await replicaPanel.getByText(/^0 in progress$/).first().click({
      modifiers: ['Alt'],
    })

    // End the test
    await page.getByRole('button', { name: 'Continue (F5)' }).click()

    // Wait for replica panel to be closed
    await page.frameLocator('iframe.webview.ready').locator('iframe[title="Tested UI"]').waitFor({ state: 'detached' })

    // Check for the generated code in the editor; Make sure indexes are used for the checkboxes and buttons
    await page.getByText(`await userEvent.click(screen.getAllByRole('checkbox', { name: /^toggle done$/i })[1])`).waitFor()
    await page.getByText(`await userEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0])`).first().waitFor()
    await page.getByText(`expect(screen.getByText(/^1 done$/i))`).waitFor()
  })
})

async function startRecorderTest(browser: Browser, exampleFolder: string, testFileSearch: string, dismissStylePrompt = false) {
  const page = await browser.newPage()

  await page.goto(`http://localhost:8080/?folder=/source/examples/${exampleFolder}`)

  // Open form-test-for-e2e.test.tsx
  await page.locator('.search-label').click()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').clear()
  await page.locator('.monaco-findInput > .monaco-inputbox > .ibwrapper > .input').type(testFileSearch)
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

  return { page, replicaPanel, debugHelper }
}

async function recordFormTest(
  browser: Browser,
  exampleFolder: string,
  testFileSearch: string,
  dismissStylePrompt = false,
) {
  const { page, replicaPanel } = await startRecorderTest(
    browser,
    exampleFolder,
    testFileSearch,
    dismissStylePrompt,
  )

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
