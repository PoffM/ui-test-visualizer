import { walk } from 'estree-walker'
import * as vscode from 'vscode'
import { string, z } from 'zod/mini'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { PanelController } from '../panel-controller/panel-controller'
import type { zRecordedEventData } from '../panel-controller/panel-router'
import type { DebuggerTracker } from '../util/debugger-tracker'

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
  // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
  const { parseSync } = require('@oxc-parser/binding-wasm32-wasi')

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

      // Weird trick to be able to manually trigger the code lens update.
      onDidChangeCodeLenses: updateCodeLens.event,
    },
  ))

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

    performEdit: async () => {
      if (Object.keys(insertions).length === 0) {
        // No edits to perform
        return
      }

      if (!editor) {
        vscode.window.showInformationMessage('No editor found')
        return
      }

      const reverseOrderInsertions = Object.entries(insertions)
        .sort((a, b) => Number(b[0]) - Number(a[0]))

      for (const [line, lines] of reverseOrderInsertions) {
        const lineNumber = Number.parseInt(line)
        const position = new vscode.Position(lineNumber - 1, 0)
        await editor.edit((editBuilder) => {
          for (const [line, _requiredImports] of lines) {
            editBuilder.insert(position, line)
          }
        })
      }

      // Figure out where to put each import statement
      // Either add a new import, or edit an existing one to import something else
      const importInsertionPoints = new Map<string, number>()
      const existingImports = new Set<string>()
      {
        // TODO avoid re-parsing for every generated line of code?
        const parsed = parseSync(editor.document.fileName, editor.document.getText(), {})
        const programJson = parsed.program
        const program = JSON.parse(programJson)

        walk(program, {
          enter(node) {
            if (node.type === 'ImportDeclaration') {
              if (node.source.type === 'Literal') {
                const endOfLastSpecifier = node.specifiers.at(-1)?.end
                if (endOfLastSpecifier) {
                  importInsertionPoints.set(node.source.value, endOfLastSpecifier)
                }
              }
              for (const specifier of node.specifiers) {
                if (['ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier'].includes(specifier.type)) {
                  existingImports.add(specifier.local.name)
                }
              }
            }
          },
        })
      }

      // Get the list of imports to add
      const importList: { importName: string, from: string }[] = []
      for (const [_lineNum, insertionGroup] of Object.entries(insertions)) {
        for (const [_code, requiredImports] of insertionGroup) {
          for (const [importName, from] of Object.entries(requiredImports)) {
            if (existingImports.has(importName)) {
              continue
            }

            importList.push({ importName, from })

            existingImports.add(importName)
          }
        }
      }

      // Edit the imports into the file
      for (const { importName, from } of importList) {
        const insertionPoint = importInsertionPoints.get(from)
        if (insertionPoint) {
          const position = editor.document.positionAt(insertionPoint)
          await editor.edit((editBuilder) => {
            editBuilder.insert(position, `, ${importName}`)
          })
        }
        else {
          await editor.edit((editBuilder) => {
            editBuilder.insert(new vscode.Position(0, 0), `import { ${importName} } from '${from}'\n`)
          })
        }
      }
    },
    insertions,
    removeInsertion,
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },
  }
}
