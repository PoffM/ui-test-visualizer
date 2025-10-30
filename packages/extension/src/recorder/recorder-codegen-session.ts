import path from 'pathe'
import * as vscode from 'vscode'
import * as z from 'zod/mini'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { PanelController } from '../panel-controller/panel-controller'
import type { ExpectStatementType, zRecordedEventData } from '../panel-controller/panel-router'
import type { DebuggerTracker } from '../util/debugger-tracker'
import { generateCodeFromInput } from './generate-code-from-input'
import { performEdit } from './perform-edit'

export type RecorderCodeGenSession = Awaited<ReturnType<typeof startRecorderCodeGenSession>>

export type RecorderCodeInsertions = Record<number, [code: string, requiredImports: Record<string, string>][]>

export type SerializedRegexp = z.infer<typeof zSerializedRegexp>
export const zSerializedRegexp = z.object({
  type: z.literal('regexp'),
  value: z.string(),
})

export interface RecordInputAsCodeParams {
  event: string
  eventData: z.infer<typeof zRecordedEventData>
  findMethod: string
  queryArg0: string | SerializedRegexp
  queryOptions?: Record<string, string | boolean | SerializedRegexp>
  useExpect?: ExpectStatementType
  useFireEvent?: boolean
}

export function startRecorderCodeGenSession(
  testFile: string,
  testFramework: SupportedFramework,
  testLibrary: TestingLibrary,
  panelController: PanelController,
) {
  const insertions: RecorderCodeInsertions = {}
  function addInsertion(line: number, text: string, requiredImports: Record<string, string>) {
    const lines = insertions[line] ?? (insertions[line] = [])
    lines.push([text, requiredImports])
    updateCodeLens.fire()
  }
  function removeInsertion(line: number, idx?: number) {
    if (idx === undefined) {
      delete insertions[line]
    }
    else {
      insertions[line]?.splice(idx, 1)
      if (insertions[line]?.length === 0) {
        delete insertions[line]
      }
    }
    updateCodeLens.fire()
  }

  const disposables = new Set<vscode.Disposable>()

  // Show Code Lens in between lines of code to indicate where the generated code will go.
  const updateCodeLens = new vscode.EventEmitter<void>()
  disposables.add(vscode.languages.registerCodeLensProvider(
    [{ pattern: testFile }],
    {
      provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        const lenses: vscode.CodeLens[] = []
        for (const [lineStr, _codeLines] of Object.entries(insertions)) {
          const line = Number(lineStr) - 1
          if (line >= 0 && line < document.lineCount) {
            const lineText = document.lineAt(line).text
            const range = new vscode.Range(line, 0, line, lineText.length)
            const title = 'Code will be inserted here after the test'
            lenses.push(new vscode.CodeLens(range, { title, command: '' }))
          }
        }
        return lenses
      },

      // Weird trick to manually trigger the code lens update.
      onDidChangeCodeLenses: updateCodeLens.event,
    },
  ))

  async function runPerformEdit() {
    await performEdit(
      testFile,
      insertions,
      panelController,
    )
  }

  disposables.add(vscode.debug.onDidChangeActiveStackItem((stackItem) => {
    if (stackItem === undefined) {
      runPerformEdit()
    }
  }))

  const hasUserEventLib = (() => {
    try {
      require.resolve('@testing-library/user-event', { paths: [path.dirname(testFile)] })
      return true
    }
    catch {
      return false
    }
  })()

  return {
    recordInputAsCode: async (
      debuggerTracker: DebuggerTracker,
      recordInputAsCodeParams: RecordInputAsCodeParams,
    ): Promise<[number, string[]] | null> => {
      const pausedLocation = await debuggerTracker.getPausedLocation()
      if (!pausedLocation) {
        return null
      }

      const { code, debugExpression, requiredImports } = generateCodeFromInput(
        hasUserEventLib,
        testLibrary,
        testFramework,
        path.join(__dirname, 'user-event-13.js'),
        recordInputAsCodeParams,
      )

      await debuggerTracker.runDebugExpression(debugExpression)
      panelController.flushPatches()

      // Add the fireEvent code
      for (const line of code) {
        addInsertion(pausedLocation.lineNumber, line, requiredImports)
      }

      return [pausedLocation.lineNumber, code] as const
    },
    performEdit: runPerformEdit,
    insertions,
    removeInsertion,
    hasUserEventLib,
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },
  }
}
