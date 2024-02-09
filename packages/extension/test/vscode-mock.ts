import path from 'node:path'
import { exec } from 'node:child_process'
import type * as vscode from 'vscode'
import { type DeepMockProxy, mockDeep } from 'vitest-mock-extended'
import { findUp } from 'find-up'
import { updateDomReplica } from 'replicate-dom'
import { Node, Window } from 'happy-dom'
import type { ExtensionSettingsKey } from '../src/extension/extension-setting'

export const defaultTestSettings: Record<ExtensionSettingsKey, unknown> = {
  'visual-ui-test-debugger.experimentalFastMode': true,
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

  vscode.workspace.getConfiguration.mockReturnValue({
    get: (section) => {
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
        if (error) { console.error(error) }
        if (stdout) { console.log(stdout) }
        if (stderr) { console.error(stderr) }
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

  vscode.debug.onDidStartDebugSession.mockImplementation((cb) => {
    startDebugCallbacks.add(cb)
    return { dispose: () => startDebugCallbacks.delete(cb) }
  })

  vscode.debug.onDidTerminateDebugSession.mockImplementation((cb) => {
    endDebugCallbacks.add(cb)
    return { dispose: () => endDebugCallbacks.delete(cb) }
  })

  const replicaWindow = new Window() as unknown as typeof globalThis.window

  // Remove the <!DOCTYPE> node.
  for (const node of Array.from(replicaWindow.document.childNodes)) {
    if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
      replicaWindow.document.removeChild(node)
    }
  }

  const panels: vscode.WebviewPanel[] = []

  vscode.window.createWebviewPanel.mockImplementation(
    (_viewType, _title, _viewColumn, _options) => {
      const panel = mockDeep<vscode.WebviewPanel>({
        webview: {
          postMessage: async (msg) => {
            if (msg.htmlPatch) {
              updateDomReplica(replicaWindow.document, msg.htmlPatch)
              onReplicaDomUpdate(replicaWindow.document)
            }
            return true
          },
        },
      })
      panels.push(panel)
      return panel
    },
  )

  return { vscode, replicaWindow }
}
