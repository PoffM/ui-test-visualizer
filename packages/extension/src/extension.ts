import '@total-typescript/ts-reset'

import { TelemetryReporter } from '@vscode/extension-telemetry'
import once from 'lodash/once'
import path from 'pathe'
import * as vscode from 'vscode'
import { z } from 'zod/mini'
import { autoSetFirstBreakpoint } from './auto-set-first-breakpoint'
import { codeLensProvider } from './code-lens-provider'
import { makeDebugConfig } from './debug-config'
import { detectTestFramework } from './framework-support/detect-test-framework'
import { myExtensionStorage } from './my-extension-storage'
import { startPanelController } from './panel-controller/panel-controller'
import { startRecorderCodeGenSession } from './recorder/record-input-as-code'
import { startDebuggerTracker } from './util/debugger-tracker'
import { extensionSetting } from './util/extension-setting'
import { hotReload } from './util/hot-reload'
import { detectTestLibrary } from './framework-support/detect-test-library'
import { createUiTestFile } from './recorder/create-ui-test-file'

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

  // Right-click a component name and click "Create UI test" -> create a test file with the name of the component
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand('ui-test-visualizer.createUiTest', () => createUiTestFile()),
  )
}

export function deactivate() { }

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

  const frameworkSetting = (() => {
    const parsed = zFrameworkSetting
      .safeParse(extensionSetting('ui-test-visualizer.testFramework'))
    return parsed.success ? parsed.data : 'autodetect'
  })()

  const frameworkInfo = await detectTestFramework(testFile, frameworkSetting)
  const testLibrary = await detectTestLibrary(testFile)

  // Save the test file before starting the debug session
  await vscode.window.activeTextEditor?.document.save()

  // Only initialize the recorder state once per debug session
  const recorderCodeGenSession = once(
    async () => testLibrary
      ? await startRecorderCodeGenSession(testFile, frameworkInfo.framework, testLibrary, panelController)
      : null,
  )

  const panelController = await startPanelController(extensionContext, storage, recorderCodeGenSession)

  const onStartDebug = vscode.debug.onDidStartDebugSession(async (currentSession) => {
    onStartDebug.dispose()

    const debuggerTracker = startDebuggerTracker(
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

    await panelController.openPanel(debuggerTracker)

    const onTerminate = vscode.debug.onDidTerminateDebugSession(
      (endedSession) => {
        if (currentSession !== endedSession) {
          return
        }

        autoBreakpoint?.dispose()
        debuggerTracker.dispose()
        panelController.dispose()
        onTerminate.dispose()
      },
    )
  })

  const debugConfig = await makeDebugConfig(
    frameworkInfo,
    testFile,
    testName,
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
