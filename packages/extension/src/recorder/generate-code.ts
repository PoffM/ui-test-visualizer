import type { z } from 'zod/mini'
import type * as vscode from 'vscode'
import type { zRecordedEventData } from '../panel-controller/panel-router'
import type { DebugPauseLocation } from '../util/debugger-tracker'
import type { TestingLibrary } from '../framework-support/detect-test-library'
import type { SerializedRegexp } from './recorder-codegen-session'

export async function generateCode(
  editor: vscode.TextEditor,
  pausedLocation: DebugPauseLocation,
  testLibrary: TestingLibrary,

  event: string,
  eventData: z.infer<typeof zRecordedEventData>,
  findMethod: string,
  queryArg0: string | SerializedRegexp,
  queryOptions: Record<string, string | boolean | SerializedRegexp> | undefined,

  useExpect?: boolean,
) {
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

  return {
    code,
    debugExpression,
    requiredImports,
  }
}
