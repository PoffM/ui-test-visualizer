import { expect, it, vi } from 'vitest'
import { findUp } from 'find-up'
import { mockDeep } from 'vitest-mock-extended'
import { debugCounterExample } from './debug-counter-example'

vi.mock('vscode', () => {
  const vscode = mockDeep<typeof import('vscode')>({})
  return vscode
})

it('replicates the test DOM into the webview (Vitest+React example)', async () => {
  const scssFile = await findUp(
    'examples/vitest-react/style.scss',
    { cwd: __filename },
  )

  if (!scssFile) {
    throw new Error(`SCSS file not found: ${scssFile}`)
  }

  const { counts, buttonColor } = await debugCounterExample({
    settings: {
      'visual-ui-test-debugger.cssFiles': [scssFile],
    },
    testFile: await findUp(
      'examples/vitest-react/test/basic.test.tsx',
      { cwd: __filename },
    ),
  })

  // The Increment button should be green (Through the green-button SCSS class), as specified using SCSS and Tailwind
  expect(buttonColor).toBe('rgb(22 101 52 / 1)')

  // The counter is incremented, then decremented
  expect(counts).toEqual([0, 1, 2, 1])
})

it('replicates the test DOM into the webview (Jest+React example)', async () => {
  const { counts } = await debugCounterExample({
    testFile: await findUp(
      'examples/jest-react/test/basic.test.tsx',
      { cwd: __filename },
    ),
  })

  // The counter is incremented, then decremented
  expect(counts).toEqual([0, 1, 2, 1])
}, {
  // jest runs slower than vitest
  timeout: 30_000,
})
