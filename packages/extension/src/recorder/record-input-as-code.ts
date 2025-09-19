import * as vscode from 'vscode'
import { z } from 'zod/mini'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { PanelController } from '../panel-controller/panel-controller'
import type { zRecordedEventData } from '../panel-controller/panel-router'
import type { DebuggerTracker } from '../util/debugger-tracker'
import { performEdit } from './perform-edit'

export type RecorderCodeGenSession = Awaited<ReturnType<typeof startRecorderCodeGenSession>>

export type RecorderCodeInsertions = Record<number, [code: string, requiredImports: Record<string, string>][]>

export type SerializedRegexp = z.infer<typeof zSerializedRegexp>
export const zSerializedRegexp = z.object({
  type: z.literal('regexp'),
  value: z.string(),
})

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
      editor,
      insertions,
      panelController,
    )
  }

  disposables.add(vscode.debug.onDidChangeActiveStackItem((stackItem) => {
    if (stackItem === undefined) {
      runPerformEdit()
    }
  }))

  let editor: vscode.TextEditor | undefined

  return {
    recordInputAsCode: async (
      debuggerTracker: DebuggerTracker,
      event: string,
      eventData: z.infer<typeof zRecordedEventData>,
      findMethod: string,
      queryArg0: string | SerializedRegexp,
      queryOptions: Record<string, string | boolean | SerializedRegexp> | undefined,
    ): Promise<[number, string] | null> => {
      const pausedLocation = await debuggerTracker.getPausedLocation()
      if (!pausedLocation) {
        return null
      }

      editor = vscode.window.visibleTextEditors.find(
        editor => editor.document.uri.path === pausedLocation.filePath.toString(),
      ) ?? editor
      if (!editor) {
        return null
      }

      const parsedQueryOptions = queryOptions && Object.entries(queryOptions).reduce(
        (result, entry) => {
          const [key, val] = entry
          result[key] = (() => {
            if (typeof val === 'string') {
              return `'${val.replace(/'/g, '\\\'')}'`
            }
            else if (typeof val === 'boolean') {
              return val
            }
            else if (val.type === 'regexp') {
              return val.value
            }
            else {
              return ''
            }
          })()

          return result
        },
        {} as Record<string, RegExp | boolean | string>,
      )

      const queryArgsStr = (() => {
        let result = typeof queryArg0 === 'string' ? `'${queryArg0}'` : queryArg0.value
        if (!parsedQueryOptions) {
          return result
        }
        const entries = Object.entries(parsedQueryOptions).map(([key, val]) => {
          return `${key}: ${String(val)}`
        })
        let optionsStr = entries.join(', ')
        if (entries.length > 0) {
          optionsStr = `{ ${optionsStr} }`
          result += `, ${optionsStr}`
        }
        return result
      })()

      const fireEvent = 'fireEvent'
      const screen = 'screen'

      /**
       * e.g. `screen.getByRole('button', { name: 'Submit' })`
       * or just `document`
       */
      const selector = (() => {
        if (queryArg0 === 'document') {
          return 'document'
        }
        return `${screen}.${findMethod}(${queryArgsStr})`
      })()

      const fireEventArgs = (() => {
        if (event === 'change' && eventData.text) {
          const value = eventData.text.replace(/'/g, '\\\'')
          return `, { target: { value: '${value}' } }`
        }
        return ''
      })()

      let code = `${fireEvent}.${event}(${selector}${fireEventArgs})`

      const line = editor.document.lineAt(pausedLocation.lineNumber - 1)
      const indent = line.text.match(/^\s*/)?.[0] || ''
      code = `${indent}${code}`

      // Figure out which imports need to be added
      const requiredImports: Record<string, string> = {
        [fireEvent]: testLibrary,
        [screen]: testLibrary,
      }

      // Replicate the input event from the webview to the test runtime.
      // We do this through a debug expression, which is the same as running code through vscode's 'Debug Terminal'.
      const debugExpression = `
(() => {
${Object.entries(requiredImports).map(([importName, from]) => `const { ${importName} } = require('${from}');`).join('\n')}
${code};
})()
`

      await debuggerTracker.runDebugExpression(debugExpression)
      panelController.flushPatches()

      // Add the fireEvent code
      addInsertion(pausedLocation.lineNumber, `${code}\n`, requiredImports)

      return [pausedLocation.lineNumber, code] as const
    },
    performEdit: runPerformEdit,
    insertions,
    removeInsertion,
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },
  }
}
