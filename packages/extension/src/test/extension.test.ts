import { expect, it, vi } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'
import type * as vscode from 'vscode'
import { queryByText } from '@testing-library/dom'
import { activate } from '../extension/extension'
import { initVscodeMock } from './vscode-mock'

vi.mock('vscode', () => {
  const vscode = mockDeep<typeof import('vscode')>({})
  return vscode
})

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

  // The counter is incremented, then decremented
  expect(counts).toEqual([0, 1, 2, 1])
})
