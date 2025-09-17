import type { inferProcedureInput } from '@trpc/server'
import { walk } from 'estree-walker'
import * as vscode from 'vscode'
import { z } from 'zod/mini'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import { detectTestLibrary } from '../framework-support/detect-test-library'
import type { PanelController } from '../panel-controller/panel-controller'
import type { panelRouter } from '../panel-controller/panel-router'
import type { DebuggerTracker } from '../util/debugger-tracker'

export type RecorderCodeGenSession = Awaited<ReturnType<typeof startRecorderCodeGenSession>>

export type SerializedRegexp = z.infer<typeof zSerializedRegexp>
export const zSerializedRegexp = z.object({
  type: z.literal('regexp'),
  value: z.string(),
})

export async function startRecorderCodeGenSession(
  testFile: string,
  testFramework: SupportedFramework,
  testLibrary: TestingLibrary,
  panelController: PanelController,
) {
  // @ts-expect-error import the wasm file directly
  const { parseSync } = await import('@oxc-parser/binding-wasm32-wasi')

  let offset = 0

  return {
    recordInputAsCode: async (
      debuggerTracker: DebuggerTracker,
      event: string,
      eventData: inferProcedureInput<typeof panelRouter.recordInputAsCode>['eventData'],
      findMethod: string,
      queryArg0: string | SerializedRegexp,
      queryOptions: Record<string, string | boolean | SerializedRegexp> | undefined,
    ) => {
      const pausedLocation = await debuggerTracker.getPausedLocation()
      if (!pausedLocation) {
        return
      }

      const editor = vscode.window.visibleTextEditors.find(
        editor => editor.document.uri.path === pausedLocation.filePath.toString(),
      )
      if (!editor) {
        return
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
      const requiredImports = new Map<string, { from: string }>([
        [fireEvent, { from: testLibrary }],
        [screen, { from: testLibrary }],
      ])

      // Replicate the input event from the webview to the test runtime.
      // We do this through a debug expression, which is the same as running code through vscode's 'Debug Terminal'.
      const debugExpression = `
(() => {
${[...requiredImports.entries()].map(([importName, { from }]) => `const { ${importName} } = require('${from}');`).join('\n')}
${code};
})()
`

      await debuggerTracker.runDebugExpression(
        debugExpression,
      )
      panelController.flushPatches()

      const importInsertionPoints = new Map<string, number>()
      {
        // TODO avoid re-parsing for every generated line of code
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
                  requiredImports.delete(specifier.local.name)
                }
              }
            }
          },
        })
      }

      // Do the code edit

      // Add the fireEvent code
      if (editor && pausedLocation) {
        const position = new vscode.Position(pausedLocation.lineNumber - 1 + offset, 0)
        await editor.edit((editBuilder) => {
          editBuilder.insert(position, `${code}\n`)
          offset += 1
        })
      }

      // Add missing imports
      for (const [importName, { from }] of requiredImports) {
        const insertionPoint = importInsertionPoints.get(from)
        if (insertionPoint) {
          const position = editor.document.positionAt(insertionPoint)
          await editor.edit((editBuilder) => {
            editBuilder.insert(position, `, ${importName}`)
            offset += 1
          })
        }
        else {
          await editor.edit((editBuilder) => {
            editBuilder.insert(new vscode.Position(0, 0), `import { ${importName} } from '${from}'\n`)
            offset += 1
          })
        }
      }
    },
  }
}
