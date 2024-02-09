import { queryByText } from '@testing-library/dom'
import { mockDeep } from 'vitest-mock-extended'
import type * as vscode from 'vscode'
import { activate } from '../src/extension/extension'
import type { defaultTestSettings } from './vscode-mock'
import { initVscodeMock } from './vscode-mock'

export interface DebugRunCounterExampleParams {
  testFile?: string
  settings?: Partial<typeof defaultTestSettings>
}

/**
 * Runs the counter component test in the "examples" folders.
 */
export async function debugCounterExample({
  testFile,
  settings,
}: DebugRunCounterExampleParams) {
  const result: {
    counts: number[]
    buttonColor: string | null
  } = {
    counts: [],
    buttonColor: null,
  }

  // eslint-disable-next-line no-async-promise-executor
  await new Promise<void>(async (resolve) => {
    const { vscode, replicaWindow } = await initVscodeMock({
      settings,
      testFile,
      onReplicaDomUpdate(doc) {
        const count = queryByText(doc.body, /^Count:/)
        if (count) {
          const countNum = Number(count.textContent?.match(/Count:\s*(\d+)/)?.[1])
          if (countNum !== result.counts.at(-1)) {
            result.counts.push(Number(countNum))
          }
        }

        const button = queryByText(doc.body, 'Increment')
        if (button) {
          result.buttonColor = replicaWindow.getComputedStyle(button).backgroundColor
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

  return result
}
