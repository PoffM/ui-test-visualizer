import * as vscode from 'vscode'
import type { DebugSessionTracker } from '../util/debug-session-tracker'
import type { TestLibraryInfo } from '../framework-support/detect-test-library'

export async function recordInputAsCode(
  sessionTracker: DebugSessionTracker,
  testLibraryInfo: TestLibraryInfo,
  event: string,
  method: string,
  queryArg0: string,
  queryOptions: Record<string, string | boolean> | undefined,
) {
  const parsedQueryOptions = queryOptions && Object.entries(queryOptions).reduce(
    (result, entry) => {
      const [key, val] = entry
      result[key] = typeof val === 'string' ? new RegExp(val) : val
      return result
    },
    {} as Record<string, RegExp | boolean>,
  )

  const queryArgsStr = (() => {
    let result = `'${queryArg0}'`
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

  const code = `fireEvent.${event}(${method}(${queryArgsStr}))`

  const pausedLocation = await sessionTracker.getPausedLocation()

  if (!pausedLocation) {
    return
  }

  const editor = vscode.window.visibleTextEditors.find(
    editor => editor.document.uri.path === pausedLocation.filePath.toString(),
  )
  if (editor && pausedLocation) {
    const position = new vscode.Position(pausedLocation.lineNumber - 1, pausedLocation.indent)
    await editor.edit((editBuilder) => {
      editBuilder.insert(position, `${code}\n`)
    })
  }

  // const resultStr = await ctx.sessionTracker.runDebugExpression(
  //   `globalThis.__recordInputAsCode(${JSON.stringify(method)}, ${JSON.stringify(args)})`,
  // )
  // ctx.flushPatches()
}
