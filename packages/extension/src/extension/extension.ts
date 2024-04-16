import '@total-typescript/ts-reset'

import path from 'pathe'
import * as vscode from 'vscode'
import { z } from 'zod'
import { hotReload } from './util/hot-reload'
import { detectTestFramework } from './framework-support/detect'
import { jestDebugConfig } from './framework-support/jest-support'
import { vitestDebugConfig } from './framework-support/vitest-support'
import { codeLensProvider } from './code-lens-provider'
import { startPanelController } from './panel-controller/panel-controller'
import { extensionSetting } from './util/extension-setting'
import { myExtensionStorage } from './my-extension-storage'
import { startDebugSessionTracker } from './util/debug-session-tracker'
import { autoSetFirstBreakpoint } from './auto-set-first-breakpoint'

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
    'ui-test-visualizer.visuallyDebugUI',
    (testFile: unknown, testName: unknown, startAndEndLines: unknown) => visuallyDebugUI(
      testFile,
      testName,
      startAndEndLines,
      extensionContext,
    ),
  )

  if (!extensionSetting('ui-test-visualizer.disableCodeLens')) {
    const docSelectors: vscode.DocumentFilter[] = [
      {
        pattern: String(extensionSetting('ui-test-visualizer.codeLensSelector')),
      },
    ]
    extensionContext.subscriptions.push(
      vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider),
    )
  }

  extensionContext.subscriptions.push(debugTest)
}

export function deactivate() {}

// eslint-disable-next-line import/no-mutable-exports
export let visuallyDebugUI = async (
  testFile: unknown,
  testName: unknown,
  startAndEndLines: unknown,
  extensionContext: vscode.ExtensionContext,
) => {
  const storage = myExtensionStorage(extensionContext)

  if (typeof testFile !== 'string') {
    throw new TypeError(`Expected string argument \"testFile\", received ${testFile}`)
  }
  if (typeof testName !== 'string') {
    throw new TypeError(`Expected string argument \"testName\", received ${testName}`)
  }

  // Save the test file before starting the debug session
  await vscode.window.activeTextEditor?.document.save()

  const panelController = await startPanelController(extensionContext, storage)

  const onStartDebug = vscode.debug.onDidStartDebugSession(async (currentSession) => {
    onStartDebug.dispose()

    const sessionTracker = await startDebugSessionTracker(currentSession)

    const breakpointInfoParsed = z.tuple([z.number(), z.number()])
      .safeParse(startAndEndLines)
    const autoBreakpoint = breakpointInfoParsed.success
      ? autoSetFirstBreakpoint(testFile, breakpointInfoParsed.data)
      : null

    await panelController.openPanel(sessionTracker)

    const onTerminate = vscode.debug.onDidTerminateDebugSession(
      (endedSession) => {
        if (currentSession !== endedSession) {
          return
        }

        autoBreakpoint?.dispose()
        sessionTracker.dispose()
        panelController.dispose()
        onTerminate.dispose()
      },
    )
  })

  const frameworkSetting = (() => {
    const parsed = z.enum(['autodetect', 'vitest', 'jest'])
      .safeParse(extensionSetting('ui-test-visualizer.testFramework'))
    return parsed.success ? parsed.data : 'autodetect'
  })()

  const fwInfo = await detectTestFramework(testFile, frameworkSetting)

  const debugConfig: vscode.DebugConfiguration = {
    name: DEBUG_NAME,
    request: 'launch',
    type: 'pwa-node',
    outputCapture: 'std',
    ...(fwInfo.framework === 'jest'
      ? await jestDebugConfig(testFile, testName)
      : await vitestDebugConfig(testFile, testName)),
  }

  debugConfig.env = {
    ...debugConfig.env,
    TEST_FRAMEWORK: fwInfo.framework,
    TEST_FILE_PATH: testFile,
    HTML_UPDATER_PORT: String(panelController.htmlUpdaterPort),
    TEST_CSS_FILES: JSON.stringify(await storage.get('enabledCssFiles')),
  }

  vscode.debug.startDebugging(undefined, debugConfig)
}
