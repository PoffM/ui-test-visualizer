import * as vscode from 'vscode'
import { detectTestFramework } from './framework-support/detect'
import { jestDebugConfig } from './framework-support/jest-support'
import { vitestDebugConfig } from './framework-support/vitest-support'
import { codeLensProvider } from './code-lens-provider'
import { startPanelController } from './panel-controller'
import { extensionSetting } from './extension-setting'
import { startPanelCommandHandler } from './panel-command-handler'

const DEBUG_NAME = 'Visually Debug UI'

export async function activate(extensionContext: vscode.ExtensionContext) {
  const debugTest = vscode.commands.registerCommand(
    'visual-ui-test-debugger.visuallyDebugUI',
    async (testName: unknown) => {
      if (typeof testName !== 'string') {
        throw new TypeError('Expected a string argument')
      }

      const editor = vscode.window.activeTextEditor
      if (!editor) {
        return
      }

      await editor.document.save()

      const panelController = await startPanelController()

      const onStartDebug = vscode.debug.onDidStartDebugSession(async (rootSession) => {
        onStartDebug.dispose()

        const { panel } = await panelController.openPanel(extensionContext)

        const panelCommandHandler = startPanelCommandHandler(panel, rootSession)

        const onTerminate = vscode.debug.onDidTerminateDebugSession(
          (endedSession) => {
            if (rootSession !== endedSession) {
              return
            }

            panelController.dispose()
            onTerminate.dispose()
            panelCommandHandler.dispose()
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
        TEST_CSS_FILES: JSON.stringify(
          extensionSetting('visual-ui-test-debugger.cssFiles'),
        ),
      }

      vscode.debug.startDebugging(undefined, debugConfig)
    },
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
