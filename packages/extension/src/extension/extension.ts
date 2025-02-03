import '@total-typescript/ts-reset'

import TelemetryReporter from '@vscode/extension-telemetry'
import path from 'pathe'
import * as vscode from 'vscode'
import { z } from 'zod'
import { autoSetFirstBreakpoint } from './auto-set-first-breakpoint'
import { codeLensProvider } from './code-lens-provider'
import { makeDebugConfig } from './debug-config'
import { myExtensionStorage } from './my-extension-storage'
import { startPanelController } from './panel-controller/panel-controller'
import { startDebugSessionTracker } from './util/debug-session-tracker'
import { extensionSetting } from './util/extension-setting'
import { hotReload } from './util/hot-reload'

const reporter = (() => {
  try {
    return new TelemetryReporter('InstrumentationKey=ffa9ad6b-9974-4d5c-9247-9ff01c0a4cc8;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=55f0d25f-492a-4af3-8487-d8abce8a41f6')
  }
  catch (error) {
    return null
  }
})()

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

    const sessionTracker = await startDebugSessionTracker(
      currentSession,
      () => panelController.flushPatches(),
    )

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
    const parsed = zFrameworkSetting
      .safeParse(extensionSetting('ui-test-visualizer.testFramework'))
    return parsed.success ? parsed.data : 'autodetect'
  })()

  const debugConfig = await makeDebugConfig(
    testFile,
    testName,
    frameworkSetting,
    panelController.htmlUpdaterPort,
    await storage.get('enabledCssFiles'),
  )

  vscode.debug.startDebugging(undefined, debugConfig)

  try {
    reporter?.sendTelemetryEvent('visually-debug-ui.started')
  }
  catch {}
}

export const zFrameworkSetting = z.enum(['autodetect', 'vitest', 'jest'])
