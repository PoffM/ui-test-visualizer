import * as vscode from 'vscode'
import { detectTestFramework } from './framework-support/detect'
import { jestDebugConfig } from './framework-support/jest-support'
import { vitestDebugConfig } from './framework-support/vitest-support'
import { codeLensProvider } from './code-lens-provider'
import { startPanelController } from './panel-controller'
import { extensionSetting } from './extension-setting'

interface EvalResult {
  type: string
  result: string
}

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

        panel.webview.onDidReceiveMessage(async (e) => {
          if (e === 'refresh') {
            const uiSession = await getUiTestSession()
            if (!uiSession) {
              throw new Error('Could not find UI test session')
            }

            const serializedHtml: EvalResult = await uiSession.customRequest(
              'evaluate',
              {
                expression: 'globalThis.__serializeHtml()',
                context: 'repl',
              },
            )

            console.log(serializedHtml)
          }
        })

        const sessions = [rootSession]

        const onChangeActive = vscode.debug.onDidChangeActiveDebugSession((newSession) => {
          if (newSession && isChildSession(newSession, rootSession)) {
            sessions.push(newSession)
          }
        })

        async function getUiTestSession() {
          const bps = vscode.debug.breakpoints
          for (const session of sessions) {
            for (const bp of bps) {
              const dbp = await session.getDebugProtocolBreakpoint(bp)
              if (dbp && Reflect.get(dbp, 'verified') === true) {
                return session
              }
            }
          }
          return null
        }

        const onTerminate = vscode.debug.onDidTerminateDebugSession(
          (endedSession) => {
            if (rootSession !== endedSession) {
              return
            }

            panelController.dispose()
            onTerminate.dispose()
            onChangeActive.dispose()
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

function isChildSession(child: vscode.DebugSession, parent: vscode.DebugSession) {
  if (!child.parentSession) {
    return false
  }
  if (child.parentSession?.id === parent.id) {
    return true
  }
  return isChildSession(child.parentSession, parent)
}
