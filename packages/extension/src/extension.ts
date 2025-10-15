import '@total-typescript/ts-reset'

import { TelemetryReporter } from '@vscode/extension-telemetry'
import * as vscode from 'vscode'
import * as z from 'zod/mini'
import { autoSetFirstBreakpoint } from './auto-set-first-breakpoint'
import { codeLensProvider } from './code-lens-provider'
import { makeDebugConfig } from './debug-config'
import { myExtensionStorage } from './my-extension-storage'
import { startPanelController } from './panel-controller/panel-controller'
import { startDebuggerTracker } from './util/debugger-tracker'
import { extensionSetting } from './util/extension-setting'
import { enableHotReload } from './util/hot-reload'

const reporter = (() => {
  try {
    return new TelemetryReporter('InstrumentationKey=ffa9ad6b-9974-4d5c-9247-9ff01c0a4cc8;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=55f0d25f-492a-4af3-8487-d8abce8a41f6')
  }
  catch (error) {
    return null
  }
})()

let vscodeContext: vscode.ExtensionContext
export async function activate(extensionContext: vscode.ExtensionContext) {
  vscodeContext = extensionContext
  if (process.env.NODE_ENV === 'development') {
    enableHotReload(extensionContext, __filename, deactivate)
  }

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(
      'ui-test-visualizer.visuallyDebugUI',
      (testFile: unknown, testName: unknown, startAndEndLines: unknown, firstStatementStartLine: unknown) => visuallyDebugUI(
        testFile,
        testName,
        startAndEndLines,
        firstStatementStartLine,
        extensionContext,
      ),
    ),
  )

  // Code Lens setup
  {
    let codeLensSub: vscode.Disposable | null = null
    extensionContext.subscriptions.push({ dispose: () => codeLensSub?.dispose() })

    function setupCodeLens() {
      if (extensionSetting('ui-test-visualizer.disableCodeLens')) {
        codeLensSub?.dispose()
        codeLensSub = null
        return
      }

      const docSelectors: vscode.DocumentFilter[] = [
        {
          pattern: String(extensionSetting('ui-test-visualizer.codeLensSelector')),
        },
      ]

      codeLensSub = vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider)
    }

    setupCodeLens()

    extensionContext.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('ui-test-visualizer.codeLensSelector') || e.affectsConfiguration('ui-test-visualizer.disableCodeLens')) {
          codeLensSub?.dispose()
          setupCodeLens()
        }
      }),
    )
  }
}

export function deactivate() {
  for (const disposable of vscodeContext.subscriptions) {
    disposable.dispose()
  }
  while (vscodeContext.subscriptions.length) {
    vscodeContext.subscriptions.pop()
  }
}

// eslint-disable-next-line import/no-mutable-exports
export let visuallyDebugUI = async (
  testFile: unknown,
  testName: unknown,
  startAndEndLines: unknown,
  firstStatementStartLine: unknown,
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

    const sessionTracker = await startDebuggerTracker(
      currentSession,
      {
        onFrameChange: () => panelController.flushPatches(),
        onDebugRestarted: () => panelController.notifyDebuggerRestarted(),
      },
    )

    const autoBreakpoint = (() => {
      try {
        return autoSetFirstBreakpoint(
          testFile,
          z.tuple([z.number(), z.number()]).parse(startAndEndLines),
          z.nullable(z.number()).parse(firstStatementStartLine),
        )
      }
      catch {}
    })()

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
  catch { }
}

export const zFrameworkSetting = z.enum(['autodetect', 'vitest', 'jest'])
