import path from 'node:path'
import * as vscode from 'vscode'
import { z } from 'zod'
import { hotReload } from './util/hot-reload'
import { detectTestFramework } from './framework-support/detect'
import { jestDebugConfig } from './framework-support/jest-support'
import { vitestDebugConfig } from './framework-support/vitest-support'
import { codeLensProvider } from './code-lens-provider'
import { startPanelController } from './panel-controller/panel-controller'
import { extensionSetting } from './util/extension-setting'
import type { SafeStorage } from './util/extension-storage'
import { extensionStorage } from './util/extension-storage'

const DEBUG_NAME = 'Visually Debug UI'

export async function activate(extensionContext: vscode.ExtensionContext) {
  // Hot-reload the main 'visuallyDebugUI' command function in development
  if (process.env.NODE_ENV === 'development') {
    hotReload({
      currentFile: __filename,
      exportName: 'visuallyDebugUI',
      onReload: newExport =>
        // @ts-expect-error should be the right type
        (visuallyDebugUI = newExport),
      watchOptions: [
        __dirname,
        { ignored: path.resolve(__dirname, './web-view-vite') },
      ],
    })
  }

  const debugTest = vscode.commands.registerCommand(
    'visual-ui-test-debugger.visuallyDebugUI',
    testName => visuallyDebugUI(testName, extensionContext),
  )

  if (!extensionSetting('visual-ui-test-debugger.disableCodeLens')) {
    const docSelectors: vscode.DocumentFilter[] = [
      {
        pattern: String(extensionSetting('visual-ui-test-debugger.codeLensSelector')),
      },
    ]
    extensionContext.subscriptions.push(
      vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider),
    )
  }

  extensionContext.subscriptions.push(debugTest)
}

export function deactivate() {}

function myExtensionStorage(extensionContext: vscode.ExtensionContext) {
  const schema = {
    enabledCssFiles: z.array(z.string()),
    externalCssFiles: z.array(z.string()),
  }

  type StorageShape = {
    [P in keyof typeof schema]: z.infer<typeof schema[P]>
  }

  const storage: SafeStorage<StorageShape> = extensionStorage(schema, {
    enabledCssFiles: async (paths) => {
      const workspacePaths = await workspaceCssFiles()
      const externalFiles = await storage.get('externalCssFiles')
      const validFiles = paths.filter(it =>
        workspacePaths.includes(it)
        || externalFiles?.includes(it),
      )
      return validFiles
    },
  }, extensionContext)

  return storage
}

export async function workspaceCssFiles() {
  const workspaceFiles = await vscode.workspace.findFiles(
    '**/*.{less,sass,scss,styl,stylus}',
    '**/node_modules/**',
  )

  const workspacePaths = workspaceFiles.map(it => it.path)
  return workspacePaths
}

export type MyStorageType = ReturnType<typeof myExtensionStorage>

// eslint-disable-next-line import/no-mutable-exports
export let visuallyDebugUI = async (
  testName: unknown,
  extensionContext: vscode.ExtensionContext,
) => {
  const storage = myExtensionStorage(extensionContext)

  if (typeof testName !== 'string') {
    throw new TypeError('Expected a string argument')
  }

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  await editor.document.save()

  const panelController = await startPanelController(extensionContext, storage)

  const onStartDebug = vscode.debug.onDidStartDebugSession(async (currentSession) => {
    onStartDebug.dispose()

    await panelController.openPanel(currentSession)

    const onTerminate = vscode.debug.onDidTerminateDebugSession(
      (endedSession) => {
        if (currentSession !== endedSession) {
          return
        }

        panelController.dispose()
        onTerminate.dispose()
      },
    )
  })

  const filePath = editor.document.fileName

  const fwInfo = await detectTestFramework(filePath)

  const debugConfig: vscode.DebugConfiguration = {
    name: DEBUG_NAME,
    request: 'launch',
    type: 'pwa-node',
    ...(fwInfo.framework === 'jest'
      ? await jestDebugConfig(filePath, testName)
      : await vitestDebugConfig(filePath, testName)),
  }

  debugConfig.env = {
    ...debugConfig.env,
    TEST_FRAMEWORK: fwInfo.framework,
    TEST_FILE_PATH: filePath,
    HTML_UPDATER_PORT: String(panelController.htmlUpdaterPort),
    TEST_CSS_FILES: JSON.stringify(await storage.get('enabledCssFiles')),
  }

  vscode.debug.startDebugging(undefined, debugConfig)
}
