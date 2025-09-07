import * as vscode from 'vscode'
import type { SupportedFramework } from '../framework-support/detect-test-framework'
import { detectTestLibrary } from '../framework-support/detect-test-library'
import type { DebugSessionTracker } from '../util/debug-session-tracker'

export type RecorderState = Awaited<ReturnType<typeof initRecorderState>>

export async function initRecorderState(testFile: string, framework: SupportedFramework) {
  return {
    testLibraryInfo: {
      framework,
      testingLibrary: await detectTestLibrary(testFile),
    },
    offset: 0,
  }
}

export async function recordInputAsCode(
  sessionTracker: DebugSessionTracker,
  state: RecorderState,
  event: string,
  findMethod: string,
  queryArg0: string,
  queryOptions: Record<string, string | boolean> | undefined,
) {
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

  let code = `fireEvent.${event}(${findMethod}(${queryArgsStr}))`

  const line = editor.document.lineAt(pausedLocation.lineNumber - 1)
  const indent = line.text.match(/^\s*/)?.[0] || ''
  code = `${indent}${code}`

  if (editor && pausedLocation) {
    const position = new vscode.Position(pausedLocation.lineNumber - 1 + state.offset, 0)
    await editor.edit((editBuilder) => {
      editBuilder.insert(position, `${code}\n`)
      state.offset += 1
    })
  }

  // const resultStr = await ctx.sessionTracker.runDebugExpression(
  //   `globalThis.__recordInputAsCode(${JSON.stringify(method)}, ${JSON.stringify(args)})`,
  // )
  // ctx.flushPatches()
}
