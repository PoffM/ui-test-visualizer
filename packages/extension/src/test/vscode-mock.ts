import { exec } from 'node:child_process'
import path from 'node:path'
import { findUp } from 'find-up'
import { Node, Window } from 'happy-dom'
import { updateDomReplica } from 'replicate-dom'
import type { DeepMockProxy } from 'vitest-mock-extended'
import { mockDeep } from 'vitest-mock-extended'
import type * as vscode from 'vscode'

export interface VscodeMockParams {
  onReplicaDomUpdate: (doc: Document) => void
  onDebugSessionFinish: (session: vscode.DebugSession) => void
}
export async function initVscodeMock({
  onReplicaDomUpdate,
  onDebugSessionFinish,
}: VscodeMockParams) {
  const vscode = await import('vscode') as DeepMockProxy<typeof import('vscode')>

  const testFile = await findUp(
    'examples/vitest-react/test/basic.test.tsx',
    { cwd: __filename },
  )

  if (!testFile) {
    throw new Error('Test file not found')
  }

  vscode.window = mockDeep<typeof vscode.window>({
    activeTextEditor: {
      document: {
        fileName: path.resolve(__dirname, testFile),
      },
    },
  })

  vscode.workspace.getConfiguration.mockReturnValue({
    get: (section) => {
      const value = testConfig[section]
      if (value === undefined) {
        throw new Error(`Config prop not implemented: ${section}`)
      }
      return value
    },
    update() { throw new Error('Not implemented') },
    has() { throw new Error('Not implemented') },
    inspect() { throw new Error('Not implemented') },
  })

  const registeredCommands = new Map<string, (...args: any[]) => any>()
  const startDebugCallbacks = new Set<(e: vscode.DebugSession) => any>()
  const endDebugCallbacks = new Set<(e: vscode.DebugSession) => any>()

  vscode.commands.registerCommand.mockImplementation((name, cb) => {
    registeredCommands.set(name, cb)
    return { dispose: () => registeredCommands.delete(name) }
  })

  vscode.commands.executeCommand.mockImplementation(async (name, ...args) => {
    const command = registeredCommands.get(name)
    if (!command) {
      throw new Error(`Command not found: ${name}`)
    }
    return await command(...args)
  })

  vscode.debug.startDebugging.mockImplementation(async (_, debugConfig) => {
    if (typeof debugConfig === 'string') {
      throw new TypeError('Expected a DebugConfiguration object')
    }
    const { program, args, env, runtimeArgs } = debugConfig

    const cmd = `${process.execPath} ${runtimeArgs.join(' ')} ${program} ${args.join(' ')}`
    const cwd = await findUp(
      'examples/vitest-react',
      { cwd: __filename, type: 'directory' },
    )

    const testProcess = exec(cmd, { env, cwd })

    testProcess.stdout?.on('data', console.log)
    testProcess.stderr?.on('data', console.error)

    const mockSession = mockDeep<vscode.DebugSession>()

    testProcess.on('exit', (code) => {
      for (const cb of endDebugCallbacks) {
        cb(mockSession)
      }
      if (code !== 0) {
        throw new Error(`Test process exited with code ${code}`)
      }
      onDebugSessionFinish(mockSession)
    })

    for (const cb of startDebugCallbacks) {
      cb(mockSession)
    }

    return true
  })

  vscode.debug.onDidStartDebugSession.mockImplementation((cb) => {
    startDebugCallbacks.add(cb)
    return { dispose: () => startDebugCallbacks.delete(cb) }
  })

  vscode.debug.onDidTerminateDebugSession.mockImplementation((cb) => {
    endDebugCallbacks.add(cb)
    return { dispose: () => endDebugCallbacks.delete(cb) }
  })

  const win = new Window() as unknown as typeof globalThis.window

  // Remove the <!DOCTYPE> node.
  for (const node of Array.from(win.document.childNodes)) {
    if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
      win.document.removeChild(node)
    }
  }

  const panels: vscode.WebviewPanel[] = []

  vscode.window.createWebviewPanel.mockImplementation(
    (_viewType, _title, _viewColumn, _options) => {
      const panel = mockDeep<vscode.WebviewPanel>({
        webview: {
          postMessage: async (msg) => {
            if (msg.htmlPatch) {
              updateDomReplica(win.document, msg.htmlPatch)
              onReplicaDomUpdate(win.document)
            }
            return true
          },
        },
      })
      panels.push(panel)
      return panel
    },
  )

  return vscode
}

export const testConfig: Record<string, unknown> = {
  'visual-ui-test-debugger.experimentalFastMode': true,
  'visual-ui-test-debugger.cssFiles': [],
  'visual-ui-test-debugger.disableCodeLens': false,
  'visual-ui-test-debugger.codeLensSelector': '**/*.{test,spec}.{jsx,tsx}',
}
