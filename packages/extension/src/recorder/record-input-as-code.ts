import * as vscode from 'vscode'
import { z } from 'zod/mini'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import { detectTestLibrary } from '../framework-support/detect-test-library'
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
) {
  const testLibrary = await detectTestLibrary(testFile)

  let offset = 0

  const codeGenSession = {
    recordInputAsCode: async (
      sessionTracker: DebuggerTracker,
      event: string,
      findMethod: string,
      queryArg0: string | SerializedRegexp,
      queryOptions: Record<string, string | boolean | SerializedRegexp> | undefined,
    ) => {
      const pausedLocation = await sessionTracker.getPausedLocation()
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
              return new RegExp(val)
            }
            else if (typeof val === 'boolean') {
              return val
            }
            else if (val.type === 'regexp') {
              return new RegExp(val.value)
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

      let code = `fireEvent.${event}(${findMethod}(${queryArgsStr}))`

      const line = editor.document.lineAt(pausedLocation.lineNumber - 1)
      const indent = line.text.match(/^\s*/)?.[0] || ''
      code = `${indent}${code}`

      if (editor && pausedLocation) {
        const position = new vscode.Position(pausedLocation.lineNumber - 1 + offset, 0)
        await editor.edit((editBuilder) => {
          editBuilder.insert(position, `${code}\n`)
          offset += 1
        })
      }

      // const resultStr = await ctx.sessionTracker.runDebugExpression(
      //   `globalThis.__recordInputAsCode(${JSON.stringify(method)}, ${JSON.stringify(args)})`,
      // )
      // ctx.flushPatches()
    },
  }
  return codeGenSession
}
