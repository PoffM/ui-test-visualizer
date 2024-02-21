import path from 'node:path'
import { exec } from 'node:child_process'
import type * as vscode from 'vscode'
import { type DeepMockProxy, mockDeep } from 'vitest-mock-extended'
import { findUp } from 'find-up'
import { applyDomPatch } from 'replicate-dom'
import { Node, Window } from 'happy-dom'
import type { ExtensionSettingsKey } from '../src/extension/extension-setting'

export const defaultTestSettings: Record<ExtensionSettingsKey, unknown> = {
  'visual-ui-test-debugger.cssFiles': [] as string[],
  'visual-ui-test-debugger.disableCodeLens': false,
  'visual-ui-test-debugger.codeLensSelector': '**/*.{test,spec}.{jsx,tsx}',
}

export interface VscodeMockParams {
  testFile?: string
  onReplicaDomUpdate: (doc: Document) => void
  onDebugSessionFinish: (session: vscode.DebugSession) => void
  settings?: Partial<typeof defaultTestSettings>
}

/** Mock out the VSCode extension api for tests. */
export async function initVscodeMock({
  testFile,
  onReplicaDomUpdate,
  onDebugSessionFinish,
  settings,
}: VscodeMockParams) {
  // @ts-expect-error The vscode module is mocked by 'vi' and 'vitest-mock-extended'.
  const vscode = await import('vscode') as DeepMockProxy<typeof import('vscode')>

  if (!testFile) {
    throw new Error('Test file not found')
  }

  vscode.window = mockDeep<typeof import('vscode').window>({
    activeTextEditor: {
      document: {
        fileName: path.resolve(__dirname, testFile),
      },
    },
  })

  const resolvedSettings = {
    ...defaultTestSettings,
    ...settings,
  }

  // @ts-expect-error property should exist
  vscode.workspace.getConfiguration.mockReturnValue({
    get: (section: string) => {
      // @ts-expect-error should work
      const value = resolvedSettings[section]
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

  // @ts-expect-error property should exist
  vscode.commands.registerCommand.mockImplementation((name, cb) => {
    registeredCommands.set(name, cb)
    return { dispose: () => registeredCommands.delete(name) }
  })

  // @ts-expect-error property should exist
  vscode.commands.executeCommand.mockImplementation(async (name, ...args) => {
    const command = registeredCommands.get(name)
    if (!command) {
      throw new Error(`Command not found: ${name}`)
    }
    return await command(...args)
  })

  // @ts-expect-error property should exist
  vscode.debug.startDebugging.mockImplementation(async (_, debugConfig) => {
    if (typeof debugConfig === 'string') {
      throw new TypeError('Expected a DebugConfiguration object')
    }
    const { program, args, env, runtimeArgs = [] } = debugConfig

    const cmd = `${process.execPath} ${runtimeArgs.join(' ')} ${program} ${args.join(' ')}`

    const pkgPath = await findUp('package.json', { cwd: testFile })
    if (!pkgPath) {
      throw new Error(`Could not find package root for ${testFile}`)
    }

    const packageRoot = await path.resolve(pkgPath, '..')

    const testProcess = exec(
      cmd,
      { env, cwd: packageRoot },
      (error, stdout, stderr) => {
        if (error) {
          console.error(error)
        }
        if (stdout) {
          console.log(stdout)
        }
        if (stderr) {
          console.error(stderr)
        }
      },
    )

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

  // @ts-expect-error property should exist
  vscode.debug.onDidStartDebugSession.mockImplementation((cb) => {
    startDebugCallbacks.add(cb)
    return { dispose: () => startDebugCallbacks.delete(cb) }
  })

  // @ts-expect-error property should exist
  vscode.debug.onDidTerminateDebugSession.mockImplementation((cb) => {
    endDebugCallbacks.add(cb)
    return { dispose: () => endDebugCallbacks.delete(cb) }
  })

  // @ts-expect-error property should exist
  vscode.debug.onDidChangeActiveDebugSession.mockImplementation(() => {
    return { dispose: () => {} }
  })

  const replicaWindow = new Window() as unknown as typeof globalThis.window

  // Remove the <!DOCTYPE> node.
  for (const node of Array.from(replicaWindow.document.childNodes)) {
    if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
      replicaWindow.document.removeChild(node)
    }
  }

  const panels: vscode.WebviewPanel[] = []

  // @ts-expect-error property should exist
  vscode.window.createWebviewPanel.mockImplementation(
    () => {
      const panel = mockDeep<vscode.WebviewPanel>({
        webview: {
          postMessage: async (msg: any) => {
            if (msg.htmlPatch) {
              applyDomPatch(replicaWindow.document, msg.htmlPatch, replicaWindow)
              onReplicaDomUpdate(replicaWindow.document)
            }
            return true
          },
          onDidReceiveMessage: () => ({ dispose: () => {} }),
        },
      })
      panels.push(panel)
      return panel
    },
  )

  // @ts-expect-error property should exist
  vscode.languages.registerInlineValuesProvider.mockImplementation(() => {
    return { dispose: () => {} }
  })

  return { vscode, replicaWindow }
}
