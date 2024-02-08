import path from 'node:path'
import { expect, it, vi } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'
import type * as vscode from 'vscode'
import { queryByText } from '@testing-library/dom'
import { activate } from '../extension/extension'
import { initVscodeMock } from './vscode-mock'

vi.mock('vscode', () => {
  const vscode = mockDeep<typeof import('vscode')>({
    workspace: {},
    commands: {},
    window: {
      activeTextEditor: {
        document: {
          fileName: path.resolve(
            __dirname,
            '../../../../examples/vitest-react/test/basic.test.tsx',
          ),
        },
      },
    },
    debug: {},
  })

  return vscode
})

export const testConfig: Record<string, unknown> = {
  'visual-ui-test-debugger.experimentalFastMode': true,
  'visual-ui-test-debugger.cssFiles': [],
  'visual-ui-test-debugger.disableCodeLens': false,
  'visual-ui-test-debugger.codeLensSelector': '**/*.{test,spec}.{jsx,tsx}',
}

it('replicates the test DOM into the webview', async () => {
  const counts: number[] = []

  // eslint-disable-next-line no-async-promise-executor
  await new Promise<void>(async (resolve) => {
    const vscode = await initVscodeMock({
      onReplicaDomUpdate(doc) {
        const count = queryByText(doc.body, /^Count:/)
        if (!count) {
          return
        }
        const countNum = Number(count.textContent?.match(/Count:\s*(\d+)/)?.[1])
        if (countNum !== counts.at(-1)) {
          counts.push(Number(countNum))
        }
      },
      onDebugSessionFinish() {
        resolve()
      },
    })

    const mockExtensionContext = mockDeep<vscode.ExtensionContext>()

    await activate(mockExtensionContext)

    await vscode.commands.executeCommand(
      'visual-ui-test-debugger.visuallyDebugUI',
      'simple react testing library test',
    )
  })

  expect(counts).toEqual([0, 1, 2, 1])
})
